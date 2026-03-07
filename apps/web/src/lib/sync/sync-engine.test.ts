import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/schema', () => ({
  localDb: {
    products: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
    categories: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
    inventory: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
    outbox: { where: vi.fn() },
    syncMeta: { get: vi.fn(), put: vi.fn() },
  },
}));

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/store/sync-store', () => ({
  useSyncStore: {
    getState: vi.fn().mockReturnValue({
      setSyncing: vi.fn(),
      setLastSyncedAt: vi.fn(),
      addConflicts: vi.fn(),
      setError: vi.fn(),
    }),
  },
}));

vi.mock('@/lib/sync/network-monitor', () => ({
  networkMonitor: {
    isOnline: true,
    subscribe: vi.fn().mockReturnValue(() => {}),
  },
}));

import { syncEngine } from './sync-engine';
import { localDb } from '@/lib/db/schema';
import { apiClient } from '@/lib/api/client';

describe('SyncEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('push', () => {
    it('does nothing when no pending entries', async () => {
      vi.mocked(localDb.outbox.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as never);

      await syncEngine.push();
      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('pull', () => {
    it('does nothing with no changes', async () => {
      vi.mocked(localDb.syncMeta.get).mockResolvedValue({ id: 1, lastServerSeq: 0, lastSyncedAt: null });
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { changes: [], nextSeq: 0 } },
      });

      await syncEngine.pull();
      expect(localDb.syncMeta.put).toHaveBeenCalledWith({
        id: 1,
        lastServerSeq: 0,
        lastSyncedAt: expect.any(Number),
      });
    });
  });
});
