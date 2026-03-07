import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DB and dependencies
vi.mock('../../config/database.js', () => ({
  db: {
    query: {
      tenants: { findFirst: vi.fn() },
      users: { findFirst: vi.fn() },
      refreshTokens: { findMany: vi.fn() },
    },
    transaction: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('./token.repository.js', () => ({
  createRefreshToken: vi.fn().mockResolvedValue({}),
  revokeRefreshToken: vi.fn().mockResolvedValue(undefined),
  revokeAllUserTokens: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret-that-is-at-least-32-chars-long',
    JWT_ACCESS_TTL: 900,
    JWT_REFRESH_TTL: 604800,
    NODE_ENV: 'test',
  },
}));

import { login, getMe } from './auth.service.js';
import { db } from '../../config/database.js';
import bcrypt from 'bcryptjs';
import { UnauthorizedError } from '../../lib/errors.js';

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('throws UnauthorizedError when user not found', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

      await expect(login({ email: 'x@x.com', password: 'pass' })).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('throws UnauthorizedError on wrong password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: 'user-id',
        email: 'x@x.com',
        passwordHash,
        tenantId: 'tenant-id',
        role: 'staff',
        fullName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      await expect(login({ email: 'x@x.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('returns tokens on valid credentials', async () => {
      const passwordHash = await bcrypt.hash('valid-password', 10);
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: 'user-id',
        email: 'x@x.com',
        passwordHash,
        tenantId: 'tenant-id',
        role: 'staff',
        fullName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const result = await login({ email: 'x@x.com', password: 'valid-password' });
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('x@x.com');
    });
  });

  describe('getMe', () => {
    it('returns sanitized user', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: 'user-id',
        email: 'x@x.com',
        passwordHash: 'hash',
        tenantId: 'tenant-id',
        role: 'admin',
        fullName: 'Admin User',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const user = await getMe('user-id');
      expect(user.id).toBe('user-id');
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('throws when user not found', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);
      await expect(getMe('nonexistent')).rejects.toThrow(UnauthorizedError);
    });
  });
});
