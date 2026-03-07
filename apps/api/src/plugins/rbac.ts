import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ROLE_HIERARCHY, type Role } from '@inventory-saas/shared';
import { ForbiddenError } from '../lib/errors.js';

declare module 'fastify' {
  interface RouteOptions {
    config?: {
      public?: boolean;
      requiredRole?: Role;
    };
  }
}

async function rbacPlugin(app: FastifyInstance) {
  app.addHook('preHandler', async (request, _reply) => {
    const routeConfig = request.routeOptions.config as Record<string, unknown> | undefined;
    const requiredRole = routeConfig?.['requiredRole'] as Role | undefined;
    if (!requiredRole) return;

    const userRole = request.user?.role as Role;
    if (!userRole || ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[requiredRole]) {
      throw new ForbiddenError(`Requires ${requiredRole} role or higher`);
    }
  });
}

export default fp(rbacPlugin, { name: 'rbac', dependencies: ['auth'] });
