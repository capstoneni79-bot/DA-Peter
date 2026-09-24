import { useEffect, useState, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { offlineSyncEngine, SyncEngineStatus, SyncState } from '../services/offlineSyncEngine';
import { indexedDbService, OfflineSyncQueueRecord } from '../services/indexedDbService';

export function useOfflineStatus() {
  const [status, setStatus] = useState<SyncEngineStatus>(() => offlineSyncEngine.getStatus());
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [pendingItems, setPendingItems] = useState<OfflineSyncQueueRecord[]>([]);

  const refreshQueueData = useCallback(async () => {
    try {
      const items = await indexedDbService.getPendingSyncQueue();
      setPendingItems(items);
      setPendingQueueCount(items.length);
    } catch {
      const legacyCount = storageService.getOfflineQueue().length;
      setPendingQueueCount(legacyCount);
    }
  }, []);

  useEffect(() => {
    refreshQueueData();

    const handleSyncStatus = (e: Event) => {
      const customEvent = e as CustomEvent<SyncEngineStatus>;
      if (customEvent.detail) {
        setStatus(customEvent.detail);
      }
      refreshQueueData();
    };

    const handleQueueChange = () => {
      refreshQueueData();
    };

    window.addEventListener('da_sync_status_updated', handleSyncStatus);
    window.addEventListener('da_offline_queue_changed', handleQueueChange);
    window.addEventListener('da_connectivity_change', handleQueueChange);

    return () => {
      window.removeEventListener('da_sync_status_updated', handleSyncStatus);
      window.removeEventListener('da_offline_queue_changed', handleQueueChange);
      window.removeEventListener('da_connectivity_change', handleQueueChange);
    };
  }, [refreshQueueData]);

  const toggleSimulateOffline = useCallback(() => {
    const nextState = !storageService.getSimulatedOffline();
    storageService.setSimulatedOffline(nextState);
    window.dispatchEvent(new CustomEvent('da_connectivity_change', { detail: { isSimulatedOffline: nextState } }));
  }, []);

  const forceSync = useCallback(async () => {
    const result = await offlineSyncEngine.syncNow();
    await refreshQueueData();
    return {
      success: result.success,
      syncedCount: result.pushedCount + result.pulledCount,
      pushedCount: result.pushedCount,
      pulledCount: result.pulledCount,
      error: result.error,
    };
  }, [refreshQueueData]);

  const clearQueue = useCallback(async () => {
    await indexedDbService.clear('syncQueue');
    storageService.clearOfflineQueue();
    await refreshQueueData();
  }, [refreshQueueData]);

  return {
    isOnline: status.isOnline,
    isBrowserOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isBackendReachable: status.isBackendReachable,
    isSimulatedOffline: storageService.getSimulatedOffline(),
    syncState: status.state as SyncState,
    pendingQueueCount,
    pendingItems,
    lastSyncedAt: status.lastSyncedAt,
    lastError: status.lastError,
    syncedThisSession: status.syncedThisSession,
    toggleSimulateOffline,
    forceSync,
    clearQueue,
    refreshQueueData,
  };
}
