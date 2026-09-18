import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        onClick={install}
        className={`flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition text-xs cursor-pointer ${
          compact ? 'px-2.5 py-1.5' : 'px-3 py-1.5'
        }`}
        title="Install Swine Registry App for Offline Use"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          id="btn-ios-install-guide"
          onClick={() => setShowIOSModal(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-emerald-600/50 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-medium text-xs transition cursor-pointer ${
            compact ? 'px-2 py-1' : 'px-3 py-1.5'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-emerald-700" />
          <span>Install (iOS)</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between border-b pb-3 border-stone-100">
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-700" /> Install on iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-stone-600">
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">1</span>
                  <span>Tap the <strong className="inline-flex items-center gap-1 text-stone-800"><Share className="w-3.5 h-3.5" /> Share</strong> button in Safari toolbar.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">2</span>
                  <span>Scroll down and tap <strong className="inline-flex items-center gap-1 text-stone-800"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong>.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">3</span>
                  <span>Open the app anytime from your home screen — fully functional even without cellular data or Wi-Fi in the field!</span>
                </p>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="mt-5 w-full rounded-lg bg-emerald-700 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
