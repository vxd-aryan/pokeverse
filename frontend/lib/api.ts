// ============================================================
// API BASE
// ============================================================
// One place that knows where the backend lives.
//
// The URL used to be typed out in full in several components
// (layout.tsx, navbar.tsx, the battle pages). That meant running
// against a local backend involved editing every one of them and
// remembering to change them all back, and a single missed file
// pointed part of the app at production while the rest talked to
// localhost - which fails in confusing, intermittent ways.
// ============================================================

/**
 * Backend origin, without a trailing slash.
 *
 * Set `NEXT_PUBLIC_API_URL` in `.env.local` for local development
 * and in Vercel's environment variables for deployments. The
 * fallback is the deployed backend, so a missing variable degrades
 * to "production works, local development talks to production"
 * rather than to a blank page.
 *
 * NEXT_PUBLIC_ is required: without that prefix Next.js keeps the
 * variable server-side and it arrives as undefined in the browser.
 */
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || 'https://pokeverse-backend1.onrender.com'
).replace(/\/+$/, '');

/** Join a path onto the API base. `apiUrl('/api/users/me')` */
export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * WebSocket origin for the battle arena.
 *
 * Derived from API_BASE rather than configured separately, so the
 * two can never drift apart: https becomes wss, http becomes ws.
 */
export function wsUrl(path: string): string {
  const base = API_BASE.replace(/^http/, 'ws');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** The stored bearer token, or null when signed out. */
export function getToken(): string | null {
  try {
    return (
      localStorage.getItem('trainer_token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token')
    );
  } catch {
    // Private browsing and blocked cookies both make localStorage
    // throw rather than return null.
    return null;
  }
}

/** Authorization header, or an empty object when signed out. */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}