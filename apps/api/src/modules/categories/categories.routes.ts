import type { FastifyInstance } from 'fastify';
import { CreateCategorySchema, UpdateCategorySchema } from '@inventory-saas/shared';
import * as repo from './categories.repository.js';
import { ok, created } from '../../lib/response.js';

export async function categoryRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const items = await repo.findAll(request.user.tenant_id);
    return ok(reply, items);
  });

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await repo.findById(request.user.tenant_id, id);
    return ok(reply, item);
  });

  app.post(
    '/',
    { config: { requiredRole: 'manager' } },
    async (request, reply) => {
      const body = CreateCategorySchema.parse(request.body);
      const item = await repo.create(request.user.tenant_id, body);
      return created(reply, item);
    },
  );

  app.patch(
    '/:id',
    { config: { requiredRole: 'manager' } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = UpdateCategorySchema.parse(request.body);
      const item = await repo.update(request.user.tenant_id, id, body);
      return ok(reply, item);
    },
  );

  app.delete(
    '/:id',
    { config: { requiredRole: 'admin' } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await repo.remove(request.user.tenant_id, id);
      return ok(reply, null);
    },
  );
}
