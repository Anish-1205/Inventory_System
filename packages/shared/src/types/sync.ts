import type { SyncEntityType, SyncOperation, SyncStatus } from '../constants/sync.js';

export interface VectorClock {
  [clientId: string]: number;
}

export interface OutboxEntry {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  vectorClock: VectorClock;
  syncStatus: SyncStatus;
  createdAt: number;
}

export interface SyncPushRequest {
  entries: OutboxEntry[];
}

export interface ConflictRecord {
  entityId: string;
  entityType: SyncEntityType;
  serverRecord: Record<string, unknown>;
  clientRecord: Record<string, unknown>;
  serverSeq: number;
}

export interface SyncPushResponse {
  accepted: string[];
  conflicts: ConflictRecord[];
}

export interface SyncChange {
  id: number;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  vectorClock: VectorClock;
  createdAt: string;
}

export interface SyncPullResponse {
  changes: SyncChange[];
  nextSeq: number;
}

export interface SyncStateResponse {
  currentSeq: number;
}

export interface SyncMeta {
  lastServerSeq: number;
  lastSyncedAt: number | null;
}
