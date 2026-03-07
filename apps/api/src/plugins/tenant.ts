import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { db } from '../config/database.js';
import { sql } from 'drizzle-orm';

async function tenantPlugin(app: FastifyInstance) {
  app.addHook('preHandler', async (request, _reply) => {
    const routeConfig = request.routeOptions.config as Record<string, unknown> | undefined;
    if (routeConfig?.['public'] === true) return;

    const tenantId = request.user?.tenant_id;
    if (!tenantId) return;

    // SET LOCAL scopes to the current transaction — safe with connection pools
    await db.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
  });
}

export default fp(tenantPlugin, { name: 'tenant', dependencies: ['auth'] });
