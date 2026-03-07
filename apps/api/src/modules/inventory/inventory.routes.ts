import type { FastifyInstance } from 'fastify';
import { AdjustInventorySchema, UpdateInventorySchema } from '@inventory-saas/shared';
import * as repo from './inventory.repository.js';
import { ok } from '../../lib/response.js';

export async function inventoryRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const items = await repo.findAll(request.user.tenant_id);
    return ok(reply, items);
  });

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await repo.findById(request.user.tenant_id, id);
    return ok(reply, item);
  });

  app.patch(
    '/:id',
    { config: { requiredRole: 'manager' } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = UpdateInventorySchema.parse(request.body);
      const item = await repo.update(request.user.tenant_id, id, body);
      return ok(reply, item);
    },
  );

  app.post(
    '/:id/adjust',
    { config: { requiredRole: 'manager' } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = AdjustInventorySchema.parse(request.body);
      const item = await repo.adjust(request.user.tenant_id, id, body);
      return ok(reply, item);
    },
  );
}
