declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string; error_description?: string }) => void;
            error_callback?: (err: { type: string; message?: string }) => void;
          }): { requestAccessToken(opts?: { prompt?: string }): void };
        };
      };
    };
  }
}

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '';

export const hasGoogleClientId = Boolean(CLIENT_ID);

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}

function waitForGSI(timeout = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const start = Date.now();
    const check = setInterval(() => {
      if (window.google?.accounts?.oauth2) { clearInterval(check); resolve(); return; }
      if (Date.now() - start > timeout) {
        clearInterval(check);
        reject(new Error('Google Sign-In library failed to load. Check your internet connection.'));
      }
    }, 100);
  });
}

export async function signInWithRealGoogle(): Promise<GoogleUserInfo> {
  if (!CLIENT_ID) throw new Error('Google Client ID is not configured.');
  await waitForGSI();

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'email profile openid',
      callback: async (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error_description || resp.error || 'Google Sign-In failed'));
          return;
        }
        try {
          const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${resp.access_token}` },
          });
          if (!r.ok) throw new Error('Failed to fetch Google profile');
          const info = await r.json() as { email: string; name?: string; picture?: string };
          resolve({
            email: info.email,
            name: info.name || info.email.split('@')[0],
            picture: info.picture,
          });
        } catch (e: any) {
          reject(new Error(e.message || 'Failed to retrieve Google account info'));
        }
      },
      error_callback: (err) => {
        if (err.type === 'popup_closed') {
          reject(new Error('popup_closed'));
        } else {
          reject(new Error(err.message || 'Google Sign-In cancelled'));
        }
      },
    });
    client.requestAccessToken({ prompt: 'select_account' });
  });
}
