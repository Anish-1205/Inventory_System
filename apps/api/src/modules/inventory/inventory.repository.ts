import { and, eq } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { inventory, syncLog } from '../../db/schema/index.js';
import type { AdjustInventoryInput, UpdateInventoryInput } from '@inventory-saas/shared';
import { SYNC_ENTITY_TYPES, SYNC_OPERATIONS } from '@inventory-saas/shared';
import { NotFoundError, ValidationError } from '../../lib/errors.js';

export async function findAll(tenantId: string) {
  return db.query.inventory.findMany({
    where: eq(inventory.tenantId, tenantId),
    with: { product: true } as Record<string, unknown>,
  });
}

export async function findById(tenantId: string, id: string) {
  return db.query.inventory.findFirst({
    where: and(eq(inventory.tenantId, tenantId), eq(inventory.id, id)),
  });
}

export async function update(tenantId: string, id: string, input: UpdateInventoryInput) {
  return db.transaction(async (tx) => {
    const existing = await tx.query.inventory.findFirst({
      where: and(eq(inventory.tenantId, tenantId), eq(inventory.id, id)),
    });
    if (!existing) throw new NotFoundError('Inventory');

    const [updated] = await tx
      .update(inventory)
      .set({ ...input, version: existing.version + 1, updatedAt: new Date() })
      .where(and(eq(inventory.tenantId, tenantId), eq(inventory.id, id)))
      .returning();

    await tx.insert(syncLog).values({
      tenantId,
      entityType: SYNC_ENTITY_TYPES.INVENTORY,
      entityId: id,
      operation: SYNC_OPERATIONS.UPDATE,
      payload: updated as unknown as Record<string, unknown>,
    });

    return updated!;
  });
}

export async function adjust(tenantId: string, id: string, input: AdjustInventoryInput) {
  return db.transaction(async (tx) => {
    const existing = await tx.query.inventory.findFirst({
      where: and(eq(inventory.tenantId, tenantId), eq(inventory.id, id)),
    });
    if (!existing) throw new NotFoundError('Inventory');

    const newQty = existing.quantityOnHand + input.adjustment;
    if (newQty < 0) {
      throw new ValidationError('Adjustment would result in negative inventory');
    }

    const [updated] = await tx
      .update(inventory)
      .set({
        quantityOnHand: newQty,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(inventory.tenantId, tenantId), eq(inventory.id, id)))
      .returning();

    await tx.insert(syncLog).values({
      tenantId,
      entityType: SYNC_ENTITY_TYPES.INVENTORY,
      entityId: id,
      operation: SYNC_OPERATIONS.UPDATE,
      payload: { ...updated, adjustmentReason: input.reason } as unknown as Record<string, unknown>,
    });

    return updated!;
  });
}
