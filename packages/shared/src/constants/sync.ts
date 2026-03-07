export const SYNC_OPERATIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export type SyncOperation = (typeof SYNC_OPERATIONS)[keyof typeof SYNC_OPERATIONS];

export const SYNC_ENTITY_TYPES = {
  PRODUCT: 'product',
  CATEGORY: 'category',
  INVENTORY: 'inventory',
} as const;

export type SyncEntityType = (typeof SYNC_ENTITY_TYPES)[keyof typeof SYNC_ENTITY_TYPES];

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  CONFLICT: 'conflict',
  ERROR: 'error',
} as const;

export type SyncStatus = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];

export const OUTBOX_BATCH_SIZE = 50;
export const SYNC_POLL_INTERVAL_MS = 30_000;
