import { z } from 'zod';
import { SYNC_ENTITY_TYPES, SYNC_OPERATIONS, SYNC_STATUS } from '../constants/sync.js';

export const VectorClockSchema = z.record(z.string(), z.number());

export const OutboxEntrySchema = z.object({
  id: z.string().uuid(),
  entityType: z.enum([
    SYNC_ENTITY_TYPES.PRODUCT,
    SYNC_ENTITY_TYPES.CATEGORY,
    SYNC_ENTITY_TYPES.INVENTORY,
  ]),
  entityId: z.string().uuid(),
  operation: z.enum([
    SYNC_OPERATIONS.CREATE,
    SYNC_OPERATIONS.UPDATE,
    SYNC_OPERATIONS.DELETE,
  ]),
  payload: z.record(z.string(), z.unknown()),
  vectorClock: VectorClockSchema,
  syncStatus: z.enum([
    SYNC_STATUS.PENDING,
    SYNC_STATUS.SYNCED,
    SYNC_STATUS.CONFLICT,
    SYNC_STATUS.ERROR,
  ]),
  createdAt: z.number(),
});

export const SyncPushRequestSchema = z.object({
  entries: z.array(OutboxEntrySchema).max(50),
});

export type OutboxEntryInput = z.infer<typeof OutboxEntrySchema>;
export type SyncPushRequestInput = z.infer<typeof SyncPushRequestSchema>;
