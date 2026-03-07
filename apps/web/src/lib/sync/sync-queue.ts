import { localDb } from '../db/schema';
import type { OutboxEntry } from '@inventory-saas/shared';
import { SYNC_STATUS, OUTBOX_BATCH_SIZE } from '@inventory-saas/shared';
import { randomUUID } from 'crypto';

export async function enqueue(
  entry: Omit<OutboxEntry, 'id' | 'syncStatus' | 'createdAt'>,
): Promise<void> {
  await localDb.outbox.add({
    ...entry,
    id: randomUUID(),
    syncStatus: SYNC_STATUS.PENDING,
    createdAt: Date.now(),
  });
}

export async function getPendingBatch(): Promise<OutboxEntry[]> {
  return localDb.outbox
    .where('syncStatus')
    .equals(SYNC_STATUS.PENDING)
    .limit(OUTBOX_BATCH_SIZE)
    .toArray();
}

export async function markSynced(ids: string[]): Promise<void> {
  await localDb.outbox
    .where('id')
    .anyOf(ids)
    .modify({ syncStatus: SYNC_STATUS.SYNCED });
}

export async function markConflict(ids: string[]): Promise<void> {
  await localDb.outbox
    .where('id')
    .anyOf(ids)
    .modify({ syncStatus: SYNC_STATUS.CONFLICT });
}
