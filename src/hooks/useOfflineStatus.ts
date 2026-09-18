import { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';

export function useOfflineStatus() {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() =>
    storageService.getSimulatedOffline()
  );
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(() =>
    storageService.getOfflineQueue().length
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      // Auto-sync if not simulated offline
      if (!storageService.getSimulatedOffline()) {
        storageService.syncOfflineQueue();
        setPendingQueueCount(storageService.getOfflineQueue().length);
      }
    };

    const handleOffline = () => {
      setIsBrowserOnline(false);
    };

    const handleConnectivityChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isSimulatedOffline: boolean }>;
      setIsSimulatedOffline(customEvent.detail.isSimulatedOffline);
      setPendingQueueCount(storageService.getOfflineQueue().length);
    };

    const handleQueueUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ count: number }>;
      setPendingQueueCount(customEvent.detail.count);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('da_connectivity_change', handleConnectivityChange);
    window.addEventListener('da_offline_queue_update', handleQueueUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('da_connectivity_change', handleConnectivityChange);
      window.removeEventListener('da_offline_queue_update', handleQueueUpdate);
    };
  }, []);

  const isOnline = isBrowserOnline && !isSimulatedOffline;

  const toggleSimulateOffline = () => {
    const nextState = !isSimulatedOffline;
    storageService.setSimulatedOffline(nextState);
    setIsSimulatedOffline(nextState);
    if (!nextState && isBrowserOnline) {
      storageService.syncOfflineQueue();
      setPendingQueueCount(0);
    }
  };

  const forceSync = () => {
    const result = storageService.syncOfflineQueue();
    setPendingQueueCount(storageService.getOfflineQueue().length);
    return result;
  };

  return {
    isOnline,
    isBrowserOnline,
    isSimulatedOffline,
    pendingQueueCount,
    toggleSimulateOffline,
    forceSync,
  };
}
