'use client';

import { useSyncStore } from '@/store/sync-store';
import { networkMonitor } from '@/lib/sync/network-monitor';
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

export function SyncStatusBar() {
  const { isSyncing, lastSyncedAt, pendingCount, error } = useSyncStore();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(networkMonitor.isOnline);
    return networkMonitor.subscribe(setIsOnline);
  }, []);

  return (
    <div
      className={clsx(
        'px-4 py-2 text-xs flex items-center gap-3 border-b',
        isOnline ? 'bg-white border-gray-200' : 'bg-amber-50 border-amber-200',
      )}
    >
      <span
        className={clsx(
          'w-2 h-2 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-amber-500',
        )}
      />
      <span className={isOnline ? 'text-gray-600' : 'text-amber-700 font-medium'}>
        {isOnline ? 'Online' : 'Offline'}
      </span>

      {isSyncing && <span className="text-blue-600 animate-pulse">Syncing...</span>}

      {pendingCount > 0 && !isSyncing && (
        <span className="text-amber-600">{pendingCount} pending changes</span>
      )}

      {lastSyncedAt && !isSyncing && (
        <span className="text-gray-400 ml-auto">
          Last synced {new Date(lastSyncedAt).toLocaleTimeString()}
        </span>
      )}

      {error && <span className="text-red-600 ml-auto">Sync error: {error}</span>}
    </div>
  );
}
