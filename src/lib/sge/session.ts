/**
 * SGE Session Pool
 *
 * Manages authenticated sessions against e-aluno.com.br with:
 * - AES-256-GCM password encryption/decryption
 * - In-memory session cache (LRU, max 50, TTL 15 min)
 * - Login deduplication (concurrent requests for same CPF share one login)
 */

import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BASE_URL = 'https://e-aluno.com.br/christ/diario';

const ENCRYPTION_KEY = process.env.EALUNO_ENCRYPTION_KEY || 'luminar-sge-default-key-2026';
const ENCRYPTION_SALT = 'ealuno-salt';

const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_SESSIONS = 50;

// ---------------------------------------------------------------------------
// Encryption helpers
// ---------------------------------------------------------------------------

function deriveKey(): Buffer {
  return crypto.scryptSync(ENCRYPTION_KEY, ENCRYPTION_SALT, 32);
}

/** Encrypt a plaintext string with AES-256-GCM (random IV). */
export function encryptPassword(text: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/** Decrypt an AES-256-GCM encrypted string. */
export function decryptPassword(text: string): string {
  const key = deriveKey();
  const [ivHex, authTagHex, encrypted] = text.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ---------------------------------------------------------------------------
// Session pool
// ---------------------------------------------------------------------------

interface CachedSession {
  cookie: string;
  expiresAt: number;
  lastUsed: number;
}

/** In-memory session cache keyed by CPF. */
const sessionPool = new Map<string, CachedSession>();

/** Pending login promises keyed by CPF – prevents duplicate concurrent logins. */
const pendingLogins = new Map<string, Promise<string>>();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Remove the least-recently-used entry from the pool. */
function evictLRU(): void {
  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  sessionPool.forEach((entry, key) => {
    if (entry.lastUsed < oldestTime) {
      oldestTime = entry.lastUsed;
      oldestKey = key;
    }
  });

  if (oldestKey) {
    sessionPool.delete(oldestKey);
  }
}

/** Clean CPF string – keep digits only. */
function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/** Perform the actual login against e-aluno. */
async function rawLogin(user: string, password: string): Promise<string> {
  const cleanedUser = cleanCPF(user);

  const body = new URLSearchParams({
    user: cleanedUser,
    user_password: password,
  });

  const res = await fetch(`${BASE_URL}/flogin.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    redirect: 'manual',
  });

  // Extract PHPSESSID from Set-Cookie headers
  const setCookieHeader = res.headers.get('set-cookie') || '';
  const phpSessionMatch = setCookieHeader.match(/PHPSESSID=([^;]+)/);

  if (!phpSessionMatch) {
    throw new Error('Nenhum cookie de sessao retornado');
  }

  const responseText = await res.text();

  // e-aluno returns "0" on success
  if (responseText.trim() !== '0') {
    throw new Error('Credenciais invalidas');
  }

  return `PHPSESSID=${phpSessionMatch[1]}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a valid session cookie for the given CPF + password.
 *
 * Returns a cached session if still valid, otherwise performs a fresh login.
 * Concurrent calls for the same CPF are deduplicated (only one login request).
 */
export async function getSession(user: string, password: string): Promise<string> {
  const key = cleanCPF(user);
  const now = Date.now();

  // Check cache
  const cached = sessionPool.get(key);
  if (cached && cached.expiresAt > now) {
    cached.lastUsed = now;
    return cached.cookie;
  }

  // Deduplicate concurrent logins for same CPF
  const pending = pendingLogins.get(key);
  if (pending) {
    return pending;
  }

  const loginPromise = rawLogin(user, password)
    .then((cookie) => {
      // Evict LRU if at capacity
      if (!sessionPool.has(key) && sessionPool.size >= MAX_SESSIONS) {
        evictLRU();
      }

      sessionPool.set(key, {
        cookie,
        expiresAt: now + SESSION_TTL_MS,
        lastUsed: now,
      });

      return cookie;
    })
    .finally(() => {
      pendingLogins.delete(key);
    });

  pendingLogins.set(key, loginPromise);
  return loginPromise;
}

/** Remove a cached session for the given CPF. */
export function invalidateSession(user: string): void {
  sessionPool.delete(cleanCPF(user));
}
