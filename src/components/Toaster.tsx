import React, { useEffect, useState, useCallback } from 'react';
import { Icon } from '../../components/Icon';
import { TOAST_EVENT, type ToastPayload } from '../lib/toast';
import { haptics } from '../lib/haptics';

const KIND_STYLES: Record<NonNullable<ToastPayload['kind']>, { bg: string; ring: string; icon: string; iconName: string }> = {
  info:    { bg: 'bg-stone-900 text-white',     ring: 'ring-stone-700',   icon: 'text-sky-300',   iconName: 'sparkles' },
  success: { bg: 'bg-emerald-600 text-white',   ring: 'ring-emerald-500', icon: 'text-white',     iconName: 'check_circle' },
  error:   { bg: 'bg-red-600 text-white',       ring: 'ring-red-500',     icon: 'text-white',     iconName: 'warning' },
  warning: { bg: 'bg-amber-500 text-stone-950', ring: 'ring-amber-400',   icon: 'text-stone-900', iconName: 'warning' },
};

export const Toaster: React.FC = () => {
  const [items, setItems] = useState<ToastPayload[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const t = (e as CustomEvent<ToastPayload>).detail;
      setItems(prev => [...prev, t]);
      if (t.kind === 'success') haptics.success();
      else if (t.kind === 'error') haptics.error();
      else if (t.kind === 'warning') haptics.warning();
      else haptics.tap();
      const ms = t.duration ?? 3500;
      window.setTimeout(() => dismiss(t.id), ms);
    };
    window.addEventListener(TOAST_EVENT, handler as EventListener);
    return () => window.removeEventListener(TOAST_EVENT, handler as EventListener);
  }, [dismiss]);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-[min(92vw,420px)] pointer-events-none"
      style={{ bottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
      aria-live="polite"
      aria-atomic="true"
    >
      {items.map(t => {
        const s = KIND_STYLES[t.kind ?? 'info'];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto ${s.bg} rounded-2xl shadow-2xl ring-1 ${s.ring} px-4 py-3 flex items-start gap-3 animate-toast-in`}
            role={t.kind === 'error' ? 'alert' : 'status'}
          >
            <Icon name={s.iconName} className={`w-5 h-5 flex-shrink-0 mt-0.5 ${s.icon}`} />
            <span className="flex-1 text-sm font-medium leading-snug break-words">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                className="text-xs font-bold uppercase tracking-wider underline underline-offset-2 hover:opacity-80 flex-shrink-0"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 w-7 h-7 -mr-1 -my-1 rounded-lg flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-white/10 transition"
              aria-label="Dismiss"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toaster;
