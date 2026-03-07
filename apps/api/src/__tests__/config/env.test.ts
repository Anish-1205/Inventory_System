import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';

// Re-declare the schema here so we can test it without triggering process.exit.
// This mirrors the schema in config/env.ts exactly.
const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(604800),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  COOKIE_SECRET: z.string().min(32),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

const validEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'a-secret-that-is-at-least-32-characters-long',
  COOKIE_SECRET: 'a-cookie-secret-that-is-at-least-32-chars',
};

describe('EnvSchema', () => {
  describe('valid input', () => {
    it('parses a minimal valid env', () => {
      const result = EnvSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
    });

    it('applies default PORT of 3001', () => {
      const result = EnvSchema.safeParse(validEnv);
      expect(result.success && result.data.PORT).toBe(3001);
    });

    it('applies default NODE_ENV of development', () => {
      const result = EnvSchema.safeParse(validEnv);
      expect(result.success && result.data.NODE_ENV).toBe('development');
    });

    it('applies default JWT_ACCESS_TTL of 900', () => {
      const result = EnvSchema.safeParse(validEnv);
      expect(result.success && result.data.JWT_ACCESS_TTL).toBe(900);
    });

    it('applies default JWT_REFRESH_TTL of 604800', () => {
      const result = EnvSchema.safeParse(validEnv);
      expect(result.success && result.data.JWT_REFRESH_TTL).toBe(604800);
    });

    it('applies default FRONTEND_URL', () => {
      const result = EnvSchema.safeParse(validEnv);
      expect(result.success && result.data.FRONTEND_URL).toBe('http://localhost:3000');
    });

    it('coerces PORT from string to number', () => {
      const result = EnvSchema.safeParse({ ...validEnv, PORT: '4000' });
      expect(result.success && result.data.PORT).toBe(4000);
    });

    it('coerces JWT_ACCESS_TTL from string to number', () => {
      const result = EnvSchema.safeParse({ ...validEnv, JWT_ACCESS_TTL: '1800' });
      expect(result.success && result.data.JWT_ACCESS_TTL).toBe(1800);
    });

    it('accepts NODE_ENV=test', () => {
      const result = EnvSchema.safeParse({ ...validEnv, NODE_ENV: 'test' });
      expect(result.success && result.data.NODE_ENV).toBe('test');
    });

    it('accepts NODE_ENV=production', () => {
      const result = EnvSchema.safeParse({ ...validEnv, NODE_ENV: 'production' });
      expect(result.success && result.data.NODE_ENV).toBe('production');
    });
  });

  describe('invalid input', () => {
    it('fails when DATABASE_URL is missing', () => {
      const { DATABASE_URL: _, ...rest } = validEnv;
      const result = EnvSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('fails when JWT_SECRET is too short (< 32 chars)', () => {
      const result = EnvSchema.safeParse({ ...validEnv, JWT_SECRET: 'short' });
      expect(result.success).toBe(false);
    });

    it('fails when COOKIE_SECRET is too short (< 32 chars)', () => {
      const result = EnvSchema.safeParse({ ...validEnv, COOKIE_SECRET: 'tooshort' });
      expect(result.success).toBe(false);
    });

    it('fails when COOKIE_SECRET is missing', () => {
      const { COOKIE_SECRET: _, ...rest } = validEnv;
      const result = EnvSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('fails when NODE_ENV is an invalid value', () => {
      const result = EnvSchema.safeParse({ ...validEnv, NODE_ENV: 'staging' });
      expect(result.success).toBe(false);
    });

    it('fails when FRONTEND_URL is not a valid URL', () => {
      const result = EnvSchema.safeParse({ ...validEnv, FRONTEND_URL: 'not-a-url' });
      expect(result.success).toBe(false);
    });
  });
});
