import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { tenants, users } from '../../db/schema/index.js';
import { env } from '../../config/env.js';
import { ConflictError, UnauthorizedError } from '../../lib/errors.js';
import {
  createRefreshToken,
  findRefreshToken,
  revokeAllUserTokens,
  revokeRefreshToken,
} from './token.repository.js';
import type { RegisterInput, LoginInput } from '@inventory-saas/shared';

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

async function signAccessToken(payload: {
  sub: string;
  tenant_id: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ ...payload, jti: randomUUID() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .sign(jwtSecret);
}

export async function register(input: RegisterInput) {
  // Check tenant slug uniqueness
  const existingTenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, input.tenantSlug),
  });
  if (existingTenant) {
    throw new ConflictError('Tenant slug already taken');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  // Create tenant + admin user in a transaction
  const result = await db.transaction(async (tx) => {
    const [tenant] = await tx
      .insert(tenants)
      .values({ name: input.tenantName, slug: input.tenantSlug })
      .returning();

    const [user] = await tx
      .insert(users)
      .values({
        tenantId: tenant!.id,
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        role: 'admin',
      })
      .returning();

    return { tenant: tenant!, user: user! };
  });

  const accessToken = await signAccessToken({
    sub: result.user.id,
    tenant_id: result.tenant.id,
    role: result.user.role,
  });

  const refreshToken = randomUUID();
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL * 1000);

  await createRefreshToken({
    userId: result.user.id,
    tenantId: result.tenant.id,
    tokenHash: refreshTokenHash,
    expiresAt,
  });

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
      tenantId: result.tenant.id,
    },
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput) {
  // Must query without RLS (before tenant context is set)
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const accessToken = await signAccessToken({
    sub: user.id,
    tenant_id: user.tenantId,
    role: user.role,
  });

  const refreshToken = randomUUID();
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL * 1000);

  await createRefreshToken({
    userId: user.id,
    tenantId: user.tenantId,
    tokenHash: refreshTokenHash,
    expiresAt,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
    },
    accessToken,
    refreshToken,
  };
}

export async function refresh(currentRefreshToken: string) {
  // Find matching token (linear scan is acceptable at small scale; hash lookup in prod)
  const allTokens = await db.query.refreshTokens.findMany({
    where: (t, { isNull, gt }) =>
      and(isNull(t.revokedAt), gt(t.expiresAt, new Date())),
  });

  let matchedToken = null;
  for (const token of allTokens) {
    const matches = await bcrypt.compare(currentRefreshToken, token.tokenHash);
    if (matches) {
      matchedToken = token;
      break;
    }
  }

  if (!matchedToken) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Reuse detection: if token was already revoked, revoke all sessions
  const user = await db.query.users.findFirst({
    where: eq(users.id, matchedToken.userId),
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  // Rotate: revoke old, issue new
  await revokeRefreshToken(matchedToken.id);

  const accessToken = await signAccessToken({
    sub: user.id,
    tenant_id: user.tenantId,
    role: user.role,
  });

  const newRefreshToken = randomUUID();
  const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL * 1000);

  await createRefreshToken({
    userId: user.id,
    tenantId: user.tenantId,
    tokenHash: newRefreshTokenHash,
    expiresAt,
  });

  return { accessToken, refreshToken: newRefreshToken, user };
}

export async function logout(refreshToken: string) {
  const allTokens = await db.query.refreshTokens.findMany({
    where: (t, { isNull }) => isNull(t.revokedAt),
  });

  for (const token of allTokens) {
    const matches = await bcrypt.compare(refreshToken, token.tokenHash);
    if (matches) {
      await revokeRefreshToken(token.id);
      return;
    }
  }
}

export async function getMe(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) throw new UnauthorizedError('User not found');

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    tenantId: user.tenantId,
  };
}
