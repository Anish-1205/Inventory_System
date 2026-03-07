import { and, eq, isNull, lt } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { refreshTokens } from '../../db/schema/index.js';

export async function createRefreshToken(data: {
  userId: string;
  tenantId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  const [token] = await db
    .insert(refreshTokens)
    .values(data)
    .returning();
  return token;
}

export async function findRefreshToken(tokenHash: string) {
  return db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenHash, tokenHash),
  });
}

export async function revokeRefreshToken(id: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, id));
}

export async function revokeAllUserTokens(userId: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokens.userId, userId),
        isNull(refreshTokens.revokedAt),
      ),
    );
}

export async function deleteExpiredTokens() {
  await db
    .delete(refreshTokens)
    .where(lt(refreshTokens.expiresAt, new Date()));
}
