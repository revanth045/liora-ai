export function getCurrentUserId(): string {
  try {
    const raw = localStorage.getItem('liora_demo_session');
    if (!raw) return 'guest';
    const s = JSON.parse(raw);
    return s?.id || s?.email || 'guest';
  } catch { return 'guest'; }
}

export function userScopedKey(base: string, uid?: string): string {
  return `${base}::${uid || getCurrentUserId()}`;
}

export function onSessionChange(cb: () => void): () => void {
  const handler = () => cb();
  const storageHandler = (e: StorageEvent) => {
    if (e.key === 'liora_demo_session') cb();
  };
  window.addEventListener('liora:session-changed', handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener('liora:session-changed', handler);
    window.removeEventListener('storage', storageHandler);
  };
}
