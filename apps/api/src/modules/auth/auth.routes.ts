import type { FastifyInstance } from 'fastify';
import { RegisterSchema, LoginSchema } from '@inventory-saas/shared';
import * as authService from './auth.service.js';
import { ok, created } from '../../lib/response.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE = 'refresh_token';
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: env.JWT_REFRESH_TTL,
};

export async function authRoutes(app: FastifyInstance) {
  app.post(
    '/register',
    { config: { public: true } },
    async (request, reply) => {
      const body = RegisterSchema.parse(request.body);
      const result = await authService.register(body);
      reply.setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
      return created(reply, { user: result.user, accessToken: result.accessToken });
    },
  );

  app.post(
    '/login',
    { config: { public: true } },
    async (request, reply) => {
      const body = LoginSchema.parse(request.body);
      const result = await authService.login(body);
      reply.setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
      return ok(reply, { user: result.user, accessToken: result.accessToken });
    },
  );

  app.post(
    '/refresh',
    { config: { public: true } },
    async (request, reply) => {
      const token = (request.cookies as Record<string, string | undefined>)[REFRESH_COOKIE];
      if (!token) {
        return reply.status(401).send({ success: false, data: null, error: 'No refresh token' });
      }
      const result = await authService.refresh(token);
      reply.setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
      return ok(reply, { accessToken: result.accessToken });
    },
  );

  app.post('/logout', async (request, reply) => {
    const token = (request.cookies as Record<string, string | undefined>)[REFRESH_COOKIE];
    if (token) {
      await authService.logout(token);
    }
    reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    return ok(reply, null);
  });

  app.get('/me', async (request, reply) => {
    const user = await authService.getMe(request.user.sub);
    return ok(reply, user);
  });
}
