import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../lib/errors.js';
import type { JwtPayload } from '@inventory-saas/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
}

const secret = new TextEncoder().encode(env.JWT_SECRET);

async function authPlugin(app: FastifyInstance) {
  app.decorateRequest('user', null);

  app.addHook('preHandler', async (request: FastifyRequest, _reply) => {
    const routeConfig = request.routeOptions.config as Record<string, unknown>;
    if (routeConfig['public'] === true) return;

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, secret);
      request.user = payload as unknown as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  });
}

export default fp(authPlugin, { name: 'auth' });
