import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { users } from '../../db/schema/index.js';
import { ok, created } from '../../lib/response.js';
import { NotFoundError } from '../../lib/errors.js';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(['admin', 'manager', 'staff']).default('staff'),
});

const UpdateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: z.enum(['admin', 'manager', 'staff']).optional(),
});

export async function userRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { config: { requiredRole: 'admin' } },
    async (request, reply) => {
      const all = await db.query.users.findMany({
        where: eq(users.tenantId, request.user.tenant_id),
      });
      const sanitized = all.map(({ passwordHash: _ph, ...u }) => u);
      return ok(reply, sanitized);
    },
  );

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await db.query.users.findFirst({
      where: and(eq(users.tenantId, request.user.tenant_id), eq(users.id, id)),
    });
    if (!user) throw new NotFoundError('User');
    const { passwordHash: _ph, ...sanitized } = user;
    return ok(reply, sanitized);
  });

  app.post(
    '/',
    { config: { requiredRole: 'admin' } },
    async (request, reply) => {
      const body = CreateUserSchema.parse(request.body);
      const passwordHash = await bcrypt.hash(body.password, 12);
      const [user] = await db
        .insert(users)
        .values({ ...body, passwordHash, tenantId: request.user.tenant_id })
        .returning();
      const { passwordHash: _ph, ...sanitized } = user!;
      return created(reply, sanitized);
    },
  );

  app.patch(
    '/:id',
    { config: { requiredRole: 'admin' } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = UpdateUserSchema.parse(request.body);
      const [updated] = await db
        .update(users)
        .set({ ...body, updatedAt: new Date() })
        .where(and(eq(users.tenantId, request.user.tenant_id), eq(users.id, id)))
        .returning();
      if (!updated) throw new NotFoundError('User');
      const { passwordHash: _ph, ...sanitized } = updated;
      return ok(reply, sanitized);
    },
  );

  app.delete(
    '/:id',
    { config: { requiredRole: 'admin' } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await db
        .delete(users)
        .where(and(eq(users.tenantId, request.user.tenant_id), eq(users.id, id)))
        .returning({ id: users.id });
      if (!result.length) throw new NotFoundError('User');
      return ok(reply, null);
    },
  );
}
