import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { categories, syncLog } from '../../db/schema/index.js';
import type { CreateCategoryInput, UpdateCategoryInput } from '@inventory-saas/shared';
import { SYNC_ENTITY_TYPES, SYNC_OPERATIONS } from '@inventory-saas/shared';
import { NotFoundError } from '../../lib/errors.js';

export async function findAll(tenantId: string) {
  return db.query.categories.findMany({
    where: and(eq(categories.tenantId, tenantId), isNull(categories.deletedAt)),
  });
}

export async function findById(tenantId: string, id: string) {
  return db.query.categories.findFirst({
    where: and(eq(categories.tenantId, tenantId), eq(categories.id, id), isNull(categories.deletedAt)),
  });
}

export async function create(tenantId: string, input: CreateCategoryInput) {
  return db.transaction(async (tx) => {
    const [category] = await tx
      .insert(categories)
      .values({ ...input, tenantId })
      .returning();

    await tx.insert(syncLog).values({
      tenantId,
      entityType: SYNC_ENTITY_TYPES.CATEGORY,
      entityId: category!.id,
      operation: SYNC_OPERATIONS.CREATE,
      payload: category as unknown as Record<string, unknown>,
    });

    return category!;
  });
}

export async function update(tenantId: string, id: string, input: UpdateCategoryInput) {
  return db.transaction(async (tx) => {
    const existing = await tx.query.categories.findFirst({
      where: and(eq(categories.tenantId, tenantId), eq(categories.id, id), isNull(categories.deletedAt)),
    });
    if (!existing) throw new NotFoundError('Category');

    const [updated] = await tx
      .update(categories)
      .set({ ...input, version: existing.version + 1, updatedAt: new Date() })
      .where(and(eq(categories.tenantId, tenantId), eq(categories.id, id)))
      .returning();

    await tx.insert(syncLog).values({
      tenantId,
      entityType: SYNC_ENTITY_TYPES.CATEGORY,
      entityId: id,
      operation: SYNC_OPERATIONS.UPDATE,
      payload: updated as unknown as Record<string, unknown>,
    });

    return updated!;
  });
}

export async function remove(tenantId: string, id: string) {
  return db.transaction(async (tx) => {
    const existing = await tx.query.categories.findFirst({
      where: and(eq(categories.tenantId, tenantId), eq(categories.id, id), isNull(categories.deletedAt)),
    });
    if (!existing) throw new NotFoundError('Category');

    await tx
      .update(categories)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(categories.tenantId, tenantId), eq(categories.id, id)));

    await tx.insert(syncLog).values({
      tenantId,
      entityType: SYNC_ENTITY_TYPES.CATEGORY,
      entityId: id,
      operation: SYNC_OPERATIONS.DELETE,
      payload: { id },
    });
  });
}
