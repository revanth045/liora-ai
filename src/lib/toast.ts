export type ToastKind = 'info' | 'success' | 'error' | 'warning';

export interface ToastOptions {
  kind?: ToastKind;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface ToastPayload extends ToastOptions {
  id: number;
  message: string;
}

const EVT = 'liora:toast';

let counter = 0;

export function toast(message: string, opts: ToastOptions = {}) {
  if (typeof window === 'undefined') return;
  const detail: ToastPayload = {
    id: ++counter,
    message,
    kind: opts.kind ?? 'info',
    duration: opts.duration ?? (opts.kind === 'error' ? 6000 : 3500),
    action: opts.action,
  };
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVT, { detail }));
}

toast.success = (m: string, o: Omit<ToastOptions, 'kind'> = {}) => toast(m, { ...o, kind: 'success' });
toast.error   = (m: string, o: Omit<ToastOptions, 'kind'> = {}) => toast(m, { ...o, kind: 'error' });
toast.warning = (m: string, o: Omit<ToastOptions, 'kind'> = {}) => toast(m, { ...o, kind: 'warning' });
toast.info    = (m: string, o: Omit<ToastOptions, 'kind'> = {}) => toast(m, { ...o, kind: 'info' });

export const TOAST_EVENT = EVT;
