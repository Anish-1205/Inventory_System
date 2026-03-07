import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SYNC_ENTITY_TYPES, SYNC_OPERATIONS, SYNC_STATUS } from '@inventory-saas/shared';
import type { OutboxEntry } from '@inventory-saas/shared';

vi.mock('../../config/database.js', () => ({
  db: {
    query: {
      syncLog: { findFirst: vi.fn(), findMany: vi.fn() },
      categories: { findFirst: vi.fn() },
      products: { findFirst: vi.fn() },
      inventory: { findFirst: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
    execute: vi.fn(),
  },
}));

import { pull, getState } from './sync.service.js';
import { db } from '../../config/database.js';

describe('sync.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('pull', () => {
    it('returns empty changes when no logs exist', async () => {
      vi.mocked(db.query.syncLog.findMany).mockResolvedValue([]);
      const result = await pull('tenant-id', 0);
      expect(result.changes).toHaveLength(0);
      expect(result.nextSeq).toBe(0);
    });

    it('maps sync_log rows to SyncChange shape', async () => {
      vi.mocked(db.query.syncLog.findMany).mockResolvedValue([
        {
          id: BigInt(42),
          tenantId: 'tenant-id',
          entityType: SYNC_ENTITY_TYPES.PRODUCT,
          entityId: 'prod-id',
          operation: SYNC_OPERATIONS.CREATE,
          payload: { name: 'Test Product' },
          vectorClock: {},
          createdAt: new Date('2026-01-01'),
        },
      ] as never);

      const result = await pull('tenant-id', 0);
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toMatchObject({
        id: 42,
        entityType: SYNC_ENTITY_TYPES.PRODUCT,
        entityId: 'prod-id',
        operation: SYNC_OPERATIONS.CREATE,
      });
      expect(result.nextSeq).toBe(42);
    });
  });

  describe('getState', () => {
    it('returns 0 when no sync log entries', async () => {
      vi.mocked(db.query.syncLog.findFirst).mockResolvedValue(undefined);
      const state = await getState('tenant-id');
      expect(state.currentSeq).toBe(0);
    });

    it('returns latest id as currentSeq', async () => {
      vi.mocked(db.query.syncLog.findFirst).mockResolvedValue({
        id: BigInt(99),
      } as never);
      const state = await getState('tenant-id');
      expect(state.currentSeq).toBe(99);
    });
  });
});
