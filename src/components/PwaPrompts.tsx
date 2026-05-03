import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import {
  bindInstallPrompt, canInstall, promptInstall, isStandalone,
  notificationPermission, requestNotificationPermission,
} from '../lib/pwa';

const DISMISS_KEY = 'liora_pwa_install_dismissed';
const NOTIF_DISMISS_KEY = 'liora_notif_prompt_dismissed';

export default function PwaPrompts() {
  const [installable, setInstallable] = useState<boolean>(canInstall());
  const [installDismissed, setInstallDismissed] = useState<boolean>(
    typeof window !== 'undefined' && !!localStorage.getItem(DISMISS_KEY)
  );
  const [notifAsk, setNotifAsk] = useState<boolean>(false);

  useEffect(() => {
    bindInstallPrompt();
    const onInstallable = (e: any) => setInstallable(!!e?.detail);
    window.addEventListener('liora:installable', onInstallable as EventListener);
    return () => window.removeEventListener('liora:installable', onInstallable as EventListener);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const perm = notificationPermission();
      const dismissed = !!localStorage.getItem(NOTIF_DISMISS_KEY);
      if (perm === 'default' && !dismissed && isStandalone()) setNotifAsk(true);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  const showInstall = installable && !installDismissed && !isStandalone();

  if (!showInstall && !notifAsk) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[60] w-[min(420px,calc(100vw-1.5rem))] flex flex-col gap-2"
         style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}>
      {showInstall && (
        <div className="rounded-2xl bg-stone-900 text-white shadow-2xl p-3 flex items-center gap-3 animate-toast-in">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icon name="sparkles" className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight">Install Liora</p>
            <p className="text-white/70 text-xs leading-snug">Add to your home screen for instant access.</p>
          </div>
          <button onClick={async () => { const ok = await promptInstall(); if (!ok) { localStorage.setItem(DISMISS_KEY, '1'); setInstallDismissed(true); } }}
            className="px-3 py-2 rounded-xl bg-white text-stone-900 font-bold text-xs hover:bg-stone-100">Install</button>
          <button onClick={() => { localStorage.setItem(DISMISS_KEY, '1'); setInstallDismissed(true); }}
            aria-label="Dismiss" className="p-2 rounded-lg hover:bg-white/10">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
      )}
      {notifAsk && (
        <div className="rounded-2xl bg-white border border-stone-200 shadow-2xl p-3 flex items-center gap-3 animate-toast-in">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Icon name="sparkles" className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight text-stone-900">Stay in the loop</p>
            <p className="text-stone-600 text-xs leading-snug">Get notified about booking confirmations and offers.</p>
          </div>
          <button onClick={async () => { await requestNotificationPermission(); setNotifAsk(false); }}
            className="px-3 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800">Enable</button>
          <button onClick={() => { localStorage.setItem(NOTIF_DISMISS_KEY, '1'); setNotifAsk(false); }}
            aria-label="Dismiss" className="p-2 rounded-lg hover:bg-stone-100">
            <Icon name="x" className="w-4 h-4 text-stone-500" />
          </button>
        </div>
      )}
    </div>
  );
}
