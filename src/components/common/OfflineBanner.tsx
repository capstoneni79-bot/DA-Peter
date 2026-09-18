import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, Database } from 'lucide-react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export const OfflineBanner: React.FC = () => {
  const { isOnline, isSimulatedOffline, pendingQueueCount, forceSync } = useOfflineStatus();
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      const res = forceSync();
      setSyncing(false);
      setSyncSuccess(`Synchronized ${res.syncedCount} offline record(s) successfully!`);
      setTimeout(() => setSyncSuccess(null), 3500);
    }, 600);
  };

  if (isOnline && pendingQueueCount === 0 && !syncSuccess) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-800 text-white px-4 py-2 text-xs sm:text-sm shadow-md flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30">
      <div className="flex items-center gap-2 font-medium">
        {!isOnline ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <WifiOff className="w-4 h-4 text-amber-200 shrink-0" />
            <span>
              <strong>Offline Mode Active</strong> {isSimulatedOffline ? '(Simulated for Testing)' : '(No Internet)'} — All additions, edits, and biosecurity records are securely stored in your device's local database.
            </span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>
              Back Online. You have <strong>{pendingQueueCount}</strong> pending update(s) to synchronize.
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {pendingQueueCount > 0 && (
          <span className="bg-amber-900/60 text-amber-100 px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1 border border-amber-400/40">
            <Database className="w-3 h-3" />
            {pendingQueueCount} pending
          </span>
        )}

        {isOnline && pendingQueueCount > 0 && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium px-3 py-1 rounded text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}

        {syncSuccess && (
          <span className="bg-emerald-900/80 text-emerald-100 px-2.5 py-1 rounded text-xs flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
            {syncSuccess}
          </span>
        )}
      </div>
    </div>
  );
};
