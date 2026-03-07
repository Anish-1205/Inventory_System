import type { FastifyInstance } from 'fastify';
import { SyncPushRequestSchema } from '@inventory-saas/shared';
import * as syncService from './sync.service.js';
import { ok } from '../../lib/response.js';

export async function syncRoutes(app: FastifyInstance) {
  app.post('/push', async (request, reply) => {
    const body = SyncPushRequestSchema.parse(request.body);
    const result = await syncService.push(request.user.tenant_id, body.entries);
    return ok(reply, result);
  });

  app.get('/pull', async (request, reply) => {
    const query = request.query as { since?: string };
    const since = Math.max(0, Number(query.since) || 0);
    const result = await syncService.pull(request.user.tenant_id, since);
    return ok(reply, result);
  });

  app.get('/state', async (request, reply) => {
    const state = await syncService.getState(request.user.tenant_id);
    return ok(reply, state);
  });
}
