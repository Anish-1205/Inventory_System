import { create } from 'zustand';
import type { ConflictRecord } from '@inventory-saas/shared';

interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  pendingCount: number;
  conflicts: ConflictRecord[];
  error: string | null;

  setSyncing: (syncing: boolean) => void;
  setLastSyncedAt: (ts: number) => void;
  setPendingCount: (count: number) => void;
  addConflicts: (conflicts: ConflictRecord[]) => void;
  resolveConflict: (entityId: string) => void;
  setError: (error: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncedAt: null,
  pendingCount: 0,
  conflicts: [],
  error: null,

  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt, error: null }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  addConflicts: (newConflicts) =>
    set((state) => ({ conflicts: [...state.conflicts, ...newConflicts] })),
  resolveConflict: (entityId) =>
    set((state) => ({
      conflicts: state.conflicts.filter((c) => c.entityId !== entityId),
    })),
  setError: (error) => set({ error }),
}));
