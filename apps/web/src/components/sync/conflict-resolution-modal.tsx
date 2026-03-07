'use client';

import { useSyncStore } from '@/store/sync-store';
import { syncEngine } from '@/lib/sync/sync-engine';
import type { ConflictRecord } from '@inventory-saas/shared';

export function ConflictResolutionModal() {
  const { conflicts, resolveConflict } = useSyncStore();

  if (conflicts.length === 0) return null;

  const conflict = conflicts[0] as ConflictRecord;

  async function handleKeepServer() {
    resolveConflict(conflict.entityId);
  }

  async function handleKeepClient() {
    // Re-push client version
    await syncEngine.push();
    resolveConflict(conflict.entityId);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Sync Conflict</h2>
        <p className="text-sm text-gray-600 mb-4">
          A conflict was detected for <strong>{conflict.entityType}</strong>{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">{conflict.entityId.slice(0, 8)}</code>
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 mb-2">Server version</p>
            <pre className="text-xs text-gray-700 overflow-auto max-h-40">
              {JSON.stringify(conflict.serverRecord, null, 2)}
            </pre>
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-700 mb-2">Your version</p>
            <pre className="text-xs text-gray-700 overflow-auto max-h-40">
              {JSON.stringify(conflict.clientRecord, null, 2)}
            </pre>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleKeepServer}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Keep Server
          </button>
          <button
            onClick={handleKeepClient}
            className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
          >
            Keep Mine
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          {conflicts.length - 1} more conflict{conflicts.length - 1 !== 1 ? 's' : ''} remaining
        </p>
      </div>
    </div>
  );
}
