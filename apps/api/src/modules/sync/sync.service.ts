import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { categories, inventory, products, syncLog } from '../../db/schema/index.js';
import type {
  ConflictRecord,
  OutboxEntry,
  SyncPullResponse,
  SyncPushResponse,
  VectorClock,
} from '@inventory-saas/shared';
import { SYNC_ENTITY_TYPES, SYNC_OPERATIONS } from '@inventory-saas/shared';
import { NotFoundError } from '../../lib/errors.js';

function mergeVectorClocks(a: VectorClock, b: VectorClock): VectorClock {
  const merged: VectorClock = { ...a };
  for (const [key, val] of Object.entries(b)) {
    merged[key] = Math.max(merged[key] ?? 0, val);
  }
  return merged;
}

async function applyCreate(tenantId: string, entry: OutboxEntry) {
  const payload = entry.payload as Record<string, unknown>;

  switch (entry.entityType) {
    case SYNC_ENTITY_TYPES.CATEGORY:
      await db.insert(categories).values({
        id: entry.entityId,
        tenantId,
        name: String(payload['name']),
        slug: String(payload['slug']),
        parentId: payload['parentId'] ? String(payload['parentId']) : null,
      }).onConflictDoNothing();
      break;
    case SYNC_ENTITY_TYPES.PRODUCT:
      await db.insert(products).values({
        id: entry.entityId,
        tenantId,
        name: String(payload['name']),
        sku: String(payload['sku']),
        unitPrice: String(payload['unitPrice']),
        categoryId: payload['categoryId'] ? String(payload['categoryId']) : null,
        barcode: payload['barcode'] ? String(payload['barcode']) : null,
        costPrice: payload['costPrice'] ? String(payload['costPrice']) : null,
      }).onConflictDoNothing();
      break;
    case SYNC_ENTITY_TYPES.INVENTORY:
      await db.insert(inventory).values({
        id: entry.entityId,
        tenantId,
        productId: String(payload['productId']),
        quantityOnHand: Number(payload['quantityOnHand'] ?? 0),
        reorderPoint: Number(payload['reorderPoint'] ?? 0),
      }).onConflictDoNothing();
      break;
  }
}

async function applyUpdate(tenantId: string, entry: OutboxEntry, serverVersion: number) {
  const payload = entry.payload as Record<string, unknown>;
  const clientVersion = Number(payload['version'] ?? 0);

  // Server-wins LWW: reject if server is newer
  if (serverVersion > clientVersion) {
    return false; // conflict
  }

  switch (entry.entityType) {
    case SYNC_ENTITY_TYPES.CATEGORY:
      await db
        .update(categories)
        .set({
          name: String(payload['name']),
          slug: String(payload['slug']),
          version: serverVersion + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(categories.tenantId, tenantId), eq(categories.id, entry.entityId)));
      break;
    case SYNC_ENTITY_TYPES.PRODUCT:
      await db
        .update(products)
        .set({
          name: payload['name'] ? String(payload['name']) : undefined,
          sku: payload['sku'] ? String(payload['sku']) : undefined,
          unitPrice: payload['unitPrice'] ? String(payload['unitPrice']) : undefined,
          version: serverVersion + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(products.tenantId, tenantId), eq(products.id, entry.entityId)));
      break;
    case SYNC_ENTITY_TYPES.INVENTORY:
      await db
        .update(inventory)
        .set({
          quantityOnHand: payload['quantityOnHand'] !== undefined
            ? Number(payload['quantityOnHand'])
            : undefined,
          reorderPoint: payload['reorderPoint'] !== undefined
            ? Number(payload['reorderPoint'])
            : undefined,
          version: serverVersion + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(inventory.tenantId, tenantId), eq(inventory.id, entry.entityId)));
      break;
  }
  return true;
}

async function applyDelete(tenantId: string, entry: OutboxEntry) {
  switch (entry.entityType) {
    case SYNC_ENTITY_TYPES.CATEGORY:
      await db
        .update(categories)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(categories.tenantId, tenantId), eq(categories.id, entry.entityId), isNull(categories.deletedAt)));
      break;
    case SYNC_ENTITY_TYPES.PRODUCT:
      await db
        .update(products)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(products.tenantId, tenantId), eq(products.id, entry.entityId), isNull(products.deletedAt)));
      break;
  }
}

async function getServerRecord(tenantId: string, entityType: string, entityId: string) {
  switch (entityType) {
    case SYNC_ENTITY_TYPES.CATEGORY:
      return db.query.categories.findFirst({
        where: and(eq(categories.tenantId, tenantId), eq(categories.id, entityId)),
      });
    case SYNC_ENTITY_TYPES.PRODUCT:
      return db.query.products.findFirst({
        where: and(eq(products.tenantId, tenantId), eq(products.id, entityId)),
      });
    case SYNC_ENTITY_TYPES.INVENTORY:
      return db.query.inventory.findFirst({
        where: and(eq(inventory.tenantId, tenantId), eq(inventory.id, entityId)),
      });
    default:
      return null;
  }
}

export async function push(tenantId: string, entries: OutboxEntry[]): Promise<SyncPushResponse> {
  const accepted: string[] = [];
  const conflicts: ConflictRecord[] = [];

  for (const entry of entries) {
    const serverRecord = await getServerRecord(tenantId, entry.entityType, entry.entityId);

    if (entry.operation === SYNC_OPERATIONS.CREATE) {
      await applyCreate(tenantId, entry);
      await db.insert(syncLog).values({
        tenantId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        operation: entry.operation,
        payload: entry.payload,
        vectorClock: entry.vectorClock,
      });
      accepted.push(entry.id);
      continue;
    }

    if (!serverRecord) {
      // Entity doesn't exist on server — treat as conflict
      if (entry.operation !== SYNC_OPERATIONS.DELETE) {
        conflicts.push({
          entityId: entry.entityId,
          entityType: entry.entityType as ConflictRecord['entityType'],
          serverRecord: {},
          clientRecord: entry.payload,
          serverSeq: 0,
        });
      }
      continue;
    }

    const serverVersion = (serverRecord as Record<string, unknown>)['version'] as number ?? 1;

    if (entry.operation === SYNC_OPERATIONS.UPDATE) {
      const ok = await applyUpdate(tenantId, entry, serverVersion);
      if (ok) {
        await db.insert(syncLog).values({
          tenantId,
          entityType: entry.entityType,
          entityId: entry.entityId,
          operation: entry.operation,
          payload: entry.payload,
          vectorClock: entry.vectorClock,
        });
        accepted.push(entry.id);
      } else {
        // Get latest sync_log seq for this entity
        const latestLog = await db.query.syncLog.findFirst({
          where: and(eq(syncLog.tenantId, tenantId), eq(syncLog.entityId, entry.entityId)),
          orderBy: (t, { desc }) => [desc(t.id)],
        });
        conflicts.push({
          entityId: entry.entityId,
          entityType: entry.entityType as ConflictRecord['entityType'],
          serverRecord: serverRecord as Record<string, unknown>,
          clientRecord: entry.payload,
          serverSeq: Number(latestLog?.id ?? 0),
        });
      }
    } else if (entry.operation === SYNC_OPERATIONS.DELETE) {
      await applyDelete(tenantId, entry);
      await db.insert(syncLog).values({
        tenantId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        operation: entry.operation,
        payload: { id: entry.entityId },
        vectorClock: entry.vectorClock,
      });
      accepted.push(entry.id);
    }
  }

  return { accepted, conflicts };
}

export async function pull(tenantId: string, since: number): Promise<SyncPullResponse> {
  const logs = await db.query.syncLog.findMany({
    where: and(eq(syncLog.tenantId, tenantId), gt(syncLog.id, BigInt(since))),
    orderBy: (t, { asc }) => [asc(t.id)],
    limit: 500,
  });

  const changes = logs.map((log) => ({
    id: Number(log.id),
    entityType: log.entityType as ConflictRecord['entityType'],
    entityId: log.entityId,
    operation: log.operation as OutboxEntry['operation'],
    payload: log.payload as Record<string, unknown>,
    vectorClock: (log.vectorClock as VectorClock) ?? {},
    createdAt: log.createdAt.toISOString(),
  }));

  const nextSeq = changes.length > 0 ? (changes[changes.length - 1]?.id ?? since) : since;

  return { changes, nextSeq };
}

export async function getState(tenantId: string) {
  const latest = await db.query.syncLog.findFirst({
    where: eq(syncLog.tenantId, tenantId),
    orderBy: (t, { desc }) => [desc(t.id)],
  });
  return { currentSeq: Number(latest?.id ?? 0) };
}
