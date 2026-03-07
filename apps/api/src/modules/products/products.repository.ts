import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { products, inventory, syncLog } from '../../db/schema/index.js';
import type { CreateProductInput, UpdateProductInput } from '@inventory-saas/shared';
import { SYNC_ENTITY_TYPES, SYNC_OPERATIONS } from '@inventory-saas/shared';
import { NotFoundError } from '../../lib/errors.js';

export async function findAll(tenantId: string) {
  return db.query.products.findMany({
    where: and(eq(products.tenantId, tenantId), isNull(products.deletedAt)),
  });
}

export async function findById(tenantId: string, id: string) {
  return db.query.products.findFirst({
    where: and(eq(products.tenantId, tenantId), eq(products.id, id), isNull(products.deletedAt)),
  });
}

export async function create(tenantId: string, input: CreateProductInput) {
  return db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({ ...input, tenantId })
      .returning();

    // Auto-create inventory record
    await tx.insert(inventory).values({
      tenantId,
      productId: product!.id,
    });

    await tx.insert(syncLog).values({
      tenantId,
      entityType: SYNC_ENTITY_TYPES.PRODUCT,
      entityId: product!.id,
      operation: SYNC_OPERATIONS.CREATE,
      payload: product as unknown as Record<string, unknown>,
    });

    return product!;
  });
}

export async function update(tenantId: string, id: string, input: UpdateProductInput) {
  return db.transaction(async (tx) => {
    const existing = await tx.query.products.findFirst({
      where: and(eq(products.tenantId, tenantId), eq(products.id, id), isNull(products.deletedAt)),
    });
    if (!existing) throw new NotFoundError('Product');

    const [updated] = await tx
      .update(products)
      .set({ ...input, version: existing.version + 1, updatedAt: new Date() })
      .where(and(eq(products.tenantId, tenantId), eq(products.id, id)))
      .returning();

    await tx.insert(syncLog).values({
      tenantId,
      entityType: SYNC_ENTITY_TYPES.PRODUCT,
      entityId: id,
      operation: SYNC_OPERATIONS.UPDATE,
      payload: updated as unknown as Record<string, unknown>,
    });

    return updated!;
  });
}

export async function remove(tenantId: string, id: string) {
  return db.transaction(async (tx) => {
    const existing = await tx.query.products.findFirst({
      where: and(eq(products.tenantId, tenantId), eq(products.id, id), isNull(products.deletedAt)),
    });
    if (!existing) throw new NotFoundError('Product');

    await tx
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(products.tenantId, tenantId), eq(products.id, id)));

    await tx.insert(syncLog).values({
      tenantId,
      entityType: SYNC_ENTITY_TYPES.PRODUCT,
      entityId: id,
      operation: SYNC_OPERATIONS.DELETE,
      payload: { id },
    });
  });
}
