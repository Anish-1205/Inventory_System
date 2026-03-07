import type { ConflictRecord } from '@inventory-saas/shared';

export type ConflictResolution = 'server' | 'client';

export interface ResolvedConflict {
  conflict: ConflictRecord;
  resolution: ConflictResolution;
}

// Default: server wins
export function resolveConflictLWW(_conflict: ConflictRecord): ConflictResolution {
  return 'server';
}

export type ConflictHandler = (conflicts: ConflictRecord[]) => Promise<ResolvedConflict[]>;
