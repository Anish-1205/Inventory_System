import 'dotenv/config';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { loggerConfig } from './lib/logger.js';
import { errorHandler } from './plugins/error-handler.js';
import authPlugin from './plugins/auth.js';
import rbacPlugin from './plugins/rbac.js';
import tenantPlugin from './plugins/tenant.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { categoryRoutes } from './modules/categories/categories.routes.js';
import { productRoutes } from './modules/products/products.routes.js';
import { inventoryRoutes } from './modules/inventory/inventory.routes.js';
import { syncRoutes } from './modules/sync/sync.routes.js';
import { userRoutes } from './modules/users/users.routes.js';

export async function buildApp() {
  const app = Fastify({ logger: loggerConfig });

  // Security plugins
  await app.register(helmet, { global: true });
  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });
  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: 'onRequest',
  });

  // Error handler
  await app.register(errorHandler);

  // Auth + RBAC + Tenant plugins (order matters)
  await app.register(authPlugin);
  await app.register(rbacPlugin);
  await app.register(tenantPlugin);

  // Routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(userRoutes, { prefix: '/api/v1/users' });
  await app.register(categoryRoutes, { prefix: '/api/v1/categories' });
  await app.register(productRoutes, { prefix: '/api/v1/products' });
  await app.register(inventoryRoutes, { prefix: '/api/v1/inventory' });
  await app.register(syncRoutes, { prefix: '/api/v1/sync' });

  // Health check (public)
  app.get('/health', { config: { public: true } }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  return app;
}

// Start server when run directly
const app = await buildApp();
await app.listen({ port: env.PORT, host: '0.0.0.0' });
