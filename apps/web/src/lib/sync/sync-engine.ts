import { apiClient } from '../api/client';
import { localDb } from '../db/schema';
import { getPendingBatch, markSynced, markConflict } from './sync-queue';
import { networkMonitor } from './network-monitor';
import { resolveConflictLWW } from './conflict-resolver';
import type { ConflictRecord, SyncChange } from '@inventory-saas/shared';
import { SYNC_ENTITY_TYPES, SYNC_STATUS } from '@inventory-saas/shared';
import { useSyncStore } from '@/store/sync-store';

async function applyServerChange(change: SyncChange): Promise<void> {
  const { entityType, entityId, operation, payload } = change;

  if (operation === 'delete') {
    switch (entityType) {
      case SYNC_ENTITY_TYPES.PRODUCT:
        await localDb.products.delete(entityId);
        break;
      case SYNC_ENTITY_TYPES.CATEGORY:
        await localDb.categories.delete(entityId);
        break;
      case SYNC_ENTITY_TYPES.INVENTORY:
        await localDb.inventory.delete(entityId);
        break;
    }
    return;
  }

  switch (entityType) {
    case SYNC_ENTITY_TYPES.PRODUCT: {
      const existing = await localDb.products.get(entityId);
      if (existing?.syncStatus === SYNC_STATUS.PENDING) return; // don't overwrite pending
      await localDb.products.put({
        ...(payload as never),
        syncStatus: SYNC_STATUS.SYNCED,
      });
      break;
    }
    case SYNC_ENTITY_TYPES.CATEGORY: {
      const existing = await localDb.categories.get(entityId);
      if (existing?.syncStatus === SYNC_STATUS.PENDING) return;
      await localDb.categories.put({
        ...(payload as never),
        syncStatus: SYNC_STATUS.SYNCED,
      });
      break;
    }
    case SYNC_ENTITY_TYPES.INVENTORY: {
      const existing = await localDb.inventory.get(entityId);
      if (existing?.syncStatus === SYNC_STATUS.PENDING) return;
      await localDb.inventory.put({
        ...(payload as never),
        syncStatus: SYNC_STATUS.SYNCED,
      });
      break;
    }
  }
}

class SyncEngine {
  private running = false;

  async push(): Promise<void> {
    if (!networkMonitor.isOnline) return;

    const batch = await getPendingBatch();
    if (batch.length === 0) return;

    const store = useSyncStore.getState();
    store.setSyncing(true);

    try {
      const { data } = await apiClient.post('/sync/push', { entries: batch });
      const { accepted, conflicts } = data.data as {
        accepted: string[];
        conflicts: ConflictRecord[];
      };

      await markSynced(accepted);

      if (conflicts.length > 0) {
        const conflictIds = conflicts.map((c) => {
          const outboxEntry = batch.find((e) => e.entityId === c.entityId);
          return outboxEntry?.id ?? '';
        }).filter(Boolean);

        await markConflict(conflictIds);
        store.addConflicts(conflicts);

        // Auto-resolve with server-wins LWW
        for (const conflict of conflicts) {
          const resolution = resolveConflictLWW(conflict);
          if (resolution === 'server') {
            await applyServerChange({
              id: conflict.serverSeq,
              entityType: conflict.entityType,
              entityId: conflict.entityId,
              operation: 'update',
              payload: conflict.serverRecord,
              vectorClock: {},
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      store.setLastSyncedAt(Date.now());
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      store.setSyncing(false);
    }
  }

  async pull(): Promise<void> {
    if (!networkMonitor.isOnline) return;

    const meta = await localDb.syncMeta.get(1);
    const since = meta?.lastServerSeq ?? 0;

    try {
      const { data } = await apiClient.get(`/sync/pull?since=${since}`);
      const { changes, nextSeq } = data.data as {
        changes: SyncChange[];
        nextSeq: number;
      };

      for (const change of changes) {
        await applyServerChange(change);
      }

      await localDb.syncMeta.put({ id: 1, lastServerSeq: nextSeq, lastSyncedAt: Date.now() });
    } catch (err) {
      console.error('Pull failed:', err);
    }
  }

  async sync(): Promise<void> {
    await this.push();
    await this.pull();
  }

  startPolling(intervalMs = 30_000): () => void {
    const timer = setInterval(() => {
      void this.sync();
    }, intervalMs);

    const unsubNetwork = networkMonitor.subscribe((online) => {
      if (online) void this.sync();
    });

    // Initial sync
    void this.sync();

    return () => {
      clearInterval(timer);
      unsubNetwork();
    };
  }
}

export const syncEngine = new SyncEngine();
