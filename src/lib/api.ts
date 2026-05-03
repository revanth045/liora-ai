// Liora — REST client for the Express + Neon API.
// All endpoints are relative so the same code works in dev (Vite proxy) and prod.

const BASE = (() => {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  // In Replit dev the client is on :5000 and the API on :3001 of the same host.
  if (host.includes('replit') && window.location.port === '5000') {
    return `${window.location.protocol}//${host.replace(':5000', '')}:3001`;
  }
  if (host === 'localhost' && window.location.port === '5000') {
    return 'http://localhost:3001';
  }
  return ''; // same origin in production
})();

async function call(method: string, path: string, body?: any) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return null;
    const text = await res.text();
    if (!res.ok) throw new Error(`API ${res.status} ${method} ${path}: ${text.slice(0, 200)}`);
    try { return text ? JSON.parse(text) : null; } catch { return text; }
  } catch (e: any) {
    // Network failures should not crash the app — caller decides what to do.
    if (typeof window !== 'undefined' && (window as any).__lioraDebug) {
      console.warn(`[api] ${method} ${path} failed:`, e?.message);
    }
    throw e;
  }
}

export const api = {
  get:  (path: string) => call('GET',  path),
  post: (path: string, body: any) => call('POST', path, body),
  put:  (path: string, body: any) => call('PUT',  path, body),
  patch:(path: string, body: any) => call('PATCH',path, body),
  del:  (path: string) => call('DELETE', path),
};

export const apiBase = BASE;
