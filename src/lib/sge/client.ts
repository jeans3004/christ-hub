// src/lib/sge/client.ts
import { BASE_URL, getSession, invalidateSession } from './session';

export interface SgeCredentials {
  user: string;
  password: string;
}

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY (e-aluno PHP format).
 */
export function toEAlunoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Check if HTML response indicates an expired session.
 */
function isSessionExpired(html: string): boolean {
  return html.includes("location.href='index.html'") || html.includes('flogin.php');
}

/**
 * Make an authenticated request to e-aluno.
 * Handles session management and automatic re-login on expiry.
 */
export async function sgeFetch(
  credentials: SgeCredentials,
  path: string,
  options: {
    method?: 'GET' | 'POST';
    body?: URLSearchParams | string;
    queryParams?: Record<string, string>;
  } = {}
): Promise<string> {
  const { method = 'POST', body, queryParams } = options;

  let url = path.startsWith('http') ? path : `${BASE_URL}/${path}`;
  if (queryParams) {
    const qs = new URLSearchParams(queryParams).toString();
    url += (url.includes('?') ? '&' : '?') + qs;
  }

  const makeRequest = async (cookie: string) => {
    const headers: Record<string, string> = {
      Cookie: cookie,
      'X-Requested-With': 'XMLHttpRequest',
    };
    if (method === 'POST') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    return fetch(url, { method, headers, body: body?.toString() });
  };

  // First attempt
  let cookie = await getSession(credentials.user, credentials.password);
  let res = await makeRequest(cookie);
  let text = await res.text();

  // If session expired, invalidate and retry once
  if (isSessionExpired(text)) {
    invalidateSession(credentials.user);
    cookie = await getSession(credentials.user, credentials.password);
    res = await makeRequest(cookie);
    text = await res.text();
    if (isSessionExpired(text)) {
      throw new Error('Sessao expirada apos re-login');
    }
  }

  return text;
}

/**
 * Make an authenticated request and parse JSON response.
 */
export async function sgeFetchJSON<T = unknown>(
  credentials: SgeCredentials,
  path: string,
  options: {
    method?: 'GET' | 'POST';
    body?: URLSearchParams;
    queryParams?: Record<string, string>;
  } = {}
): Promise<T> {
  const text = await sgeFetch(credentials, path, options);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Resposta inesperada do SGE: ${text.substring(0, 200)}`);
  }
}
