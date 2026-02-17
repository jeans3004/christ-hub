# SGE Integration Expansion - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current e-aluno proxy with a full SGE service layer featuring session pool, bidirectional sync for chamada/conteudo/ocorrencias, and report viewing.

**Architecture:** Server-side service layer (`src/lib/sge/`) with session pool (in-memory PHPSESSID cache, 15min TTL), sub-clients per domain (chamada, conteudo, ocorrencia, relatorio), and fire-and-forget immediate sync from Luminar to SGE. API routes under `/api/sge/*` replace `/api/ealuno/*`.

**Tech Stack:** Next.js 16 API Routes, TypeScript, Firestore, MUI v7, node-fetch with cookie management.

**Design doc:** `docs/plans/2026-02-17-sge-integration-expansion-design.md`

---

## Phase 1: SGE Service Layer (Core)

### Task 1: Session Pool (`src/lib/sge/session.ts`)

**Files:**
- Create: `src/lib/sge/session.ts`

**Step 1: Create session pool with LRU cache**

```typescript
// src/lib/sge/session.ts
import crypto from 'crypto';

const BASE_URL = 'https://e-aluno.com.br/christ/diario';
const ENCRYPTION_KEY = process.env.EALUNO_ENCRYPTION_KEY || 'luminar-sge-default-key-2026';
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_SESSIONS = 50;

// ========== Encryption (migrated from eAlunoProxy.ts) ==========

export function encryptPassword(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'ealuno-salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptPassword(text: string): string {
  const parts = text.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'ealuno-salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ========== Session Pool ==========

interface CachedSession {
  cookie: string;
  expiresAt: number;
  lastUsed: number;
}

const sessionCache = new Map<string, CachedSession>();
const loginLocks = new Map<string, Promise<string>>();

/** Evict oldest sessions when pool exceeds MAX_SESSIONS */
function evictIfNeeded(): void {
  if (sessionCache.size <= MAX_SESSIONS) return;
  const entries = [...sessionCache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
  const toRemove = entries.slice(0, sessionCache.size - MAX_SESSIONS);
  for (const [key] of toRemove) {
    sessionCache.delete(key);
  }
}

/** Raw login to e-aluno, returns PHPSESSID cookie string */
async function rawLogin(user: string, password: string): Promise<string> {
  const cleanUser = user.replace(/[^a-zA-Z0-9]/g, '');
  const res = await fetch(`${BASE_URL}/flogin.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ user: cleanUser, user_password: password }),
    redirect: 'manual',
  });

  const setCookies = res.headers.getSetCookie?.() || [];
  const phpSession = setCookies
    .map(c => c.split(';')[0])
    .filter(c => c.startsWith('PHPSESSID='))
    .join('; ');

  const body = await res.text();
  if (body.trim() !== '0') {
    throw new Error('Credenciais invalidas');
  }

  const cookie = phpSession || setCookies.map(c => c.split(';')[0]).join('; ');
  if (!cookie) throw new Error('Nenhum cookie de sessao retornado');

  return cookie;
}

/**
 * Get a valid session cookie for the given credentials.
 * Uses cached session if still valid, otherwise logs in.
 * Prevents duplicate concurrent logins for the same user.
 */
export async function getSession(user: string, password: string): Promise<string> {
  const cacheKey = user.replace(/[^0-9]/g, '');

  // Check cache
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    cached.lastUsed = Date.now();
    return cached.cookie;
  }

  // Prevent concurrent logins for same user
  const existingLock = loginLocks.get(cacheKey);
  if (existingLock) return existingLock;

  const loginPromise = (async () => {
    try {
      const cookie = await rawLogin(user, password);
      sessionCache.set(cacheKey, {
        cookie,
        expiresAt: Date.now() + SESSION_TTL_MS,
        lastUsed: Date.now(),
      });
      evictIfNeeded();
      return cookie;
    } finally {
      loginLocks.delete(cacheKey);
    }
  })();

  loginLocks.set(cacheKey, loginPromise);
  return loginPromise;
}

/** Invalidate cached session (e.g., after detecting expired session) */
export function invalidateSession(user: string): void {
  const cacheKey = user.replace(/[^0-9]/g, '');
  sessionCache.delete(cacheKey);
}

export { BASE_URL };
```

**Step 2: Commit**

```bash
git add src/lib/sge/session.ts
git commit -m "feat(sge): Add session pool with LRU cache and encryption"
```

---

### Task 2: HTTP Client Base (`src/lib/sge/client.ts`)

**Files:**
- Create: `src/lib/sge/client.ts`

**Step 1: Create base HTTP client**

```typescript
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
```

**Step 2: Create index re-exports**

```typescript
// src/lib/sge/index.ts
export { getSession, invalidateSession, encryptPassword, decryptPassword } from './session';
export { sgeFetch, sgeFetchJSON, toEAlunoDate } from './client';
export type { SgeCredentials } from './client';
export { chamadaClient } from './chamadaClient';
export { conteudoClient } from './conteudoClient';
export { ocorrenciaClient } from './ocorrenciaClient';
export { relatorioClient } from './relatorioClient';
```

Note: the index.ts will initially have import errors for the clients not yet created. Create it now but the exports for clients will be uncommented as they are built in subsequent tasks.

**Step 3: Commit**

```bash
git add src/lib/sge/client.ts src/lib/sge/index.ts
git commit -m "feat(sge): Add HTTP client base with auto re-login"
```

---

### Task 3: Chamada Client (`src/lib/sge/chamadaClient.ts`)

**Files:**
- Create: `src/lib/sge/chamadaClient.ts`

**Step 1: Create chamada client with all operations**

Migrate logic from `eAlunoProxy.ts` (lines 106-486) into organized methods. Key changes:
- Uses `sgeFetch` instead of raw fetch
- No session management (delegated to client.ts)
- Adds `edit`, `delete`, and `fetchDetail` with sequencia parsing

```typescript
// src/lib/sge/chamadaClient.ts
import { sgeFetch, sgeFetchJSON, toEAlunoDate } from './client';
import type { SgeCredentials } from './client';

export interface SgeSerieOption {
  serie: number;
  turma: number;
  turno: string;
  label: string;
}

export interface SgeStudent {
  id: number;
  nome: string;
}

export interface SgeChamadaDetail {
  id: number;
  nome: string;
  presente: boolean;
  sequencia?: string; // ID do registro individual no e-aluno
}

export const chamadaClient = {
  /**
   * Fetch the chamadas.php page and parse the cmbSerie dropdown.
   */
  async fetchPageOptions(credentials: SgeCredentials): Promise<SgeSerieOption[]> {
    const html = await sgeFetch(credentials, 'chamadas.php', { method: 'GET' });
    return parseCmbSerieOptions(html);
  },

  /**
   * Fetch disciplinas for a given serie/turma/turno/ano.
   */
  async fetchDisciplinas(
    credentials: SgeCredentials,
    params: { serie: number; turma: number; turno: string; ano: number }
  ): Promise<Array<{ id: number; nome: string }>> {
    const body = new URLSearchParams({
      serie: String(params.serie),
      turma: String(params.turma),
      turno: params.turno,
      ano: String(params.ano),
      show: '1',
    });
    try {
      const json = await sgeFetchJSON<Array<{ disciplina?: string; descricao?: string }>>(
        credentials, 'get_disciplinas_chamada.php', { body }
      );
      if (Array.isArray(json)) {
        return json
          .map(d => ({ id: parseInt(String(d.disciplina || '0'), 10), nome: (d.descricao || '').trim() }))
          .filter(d => d.id > 0);
      }
    } catch { /* Not JSON, return empty */ }
    return [];
  },

  /**
   * Fetch students list for a serie/turma.
   */
  async fetchStudents(
    credentials: SgeCredentials,
    params: { serie: number; turma: number; turno: string; ano: number }
  ): Promise<SgeStudent[]> {
    const html = await sgeFetch(credentials, 'show_chamadas.php', {
      queryParams: {
        serie: String(params.serie),
        turma: String(params.turma),
        turno: params.turno,
        ano: String(params.ano),
      },
      body: new URLSearchParams({ show: '1' }),
    });
    return parseStudentList(html);
  },

  /**
   * Submit chamada (attendance) to e-aluno.
   */
  async submit(
    credentials: SgeCredentials,
    params: {
      presentStudentIds: number[];
      data: string;      // YYYY-MM-DD
      aula: number;
      serie: number;
      turma: number;
      turno: string;
      disciplina: number;
      ano: number;
    }
  ): Promise<{ success: boolean; message: string }> {
    const lista = params.presentStudentIds.join(',');
    const text = await sgeFetch(credentials, `insert_chamada.php?lista=${encodeURIComponent(lista)}`, {
      body: new URLSearchParams({
        data: toEAlunoDate(params.data),
        aula: String(params.aula),
        serie: String(params.serie),
        turma: String(params.turma),
        turno: params.turno,
        disciplina: String(params.disciplina),
        ano: String(params.ano),
        add: '1',
      }),
    });
    const isError = text.toLowerCase().includes('erro') || text.toLowerCase().includes('error');
    return { success: !isError, message: isError ? text.trim() : 'Chamada registrada no SGE' };
  },

  /**
   * Edit individual student presence (P/F).
   * parametro: "." = presente, "F" = falta
   */
  async edit(
    credentials: SgeCredentials,
    params: { parametro: '.' | 'F'; sequencia: string }
  ): Promise<{ success: boolean }> {
    const text = await sgeFetch(credentials, 'edit_chamada.php', {
      body: new URLSearchParams({
        parametro: params.parametro,
        sequencia: params.sequencia,
        edit: '1',
      }),
    });
    // edit_chamada.php reloads the page on success, doesn't return "0"
    return { success: !text.toLowerCase().includes('erro') };
  },

  /**
   * Delete chamada for a specific date/discipline.
   */
  async delete(
    credentials: SgeCredentials,
    params: {
      serie: number;
      turma: number;
      turno: string;
      disciplina: number;
      data: string; // YYYY-MM-DD
    }
  ): Promise<{ success: boolean }> {
    const text = await sgeFetch(credentials, 'delete_chamada.php', {
      body: new URLSearchParams({
        serie: String(params.serie),
        turma: String(params.turma),
        turno: params.turno,
        disciplina: String(params.disciplina),
        data: toEAlunoDate(params.data),
        del: '1',
      }),
    });
    return { success: !text.toLowerCase().includes('erro') };
  },

  /**
   * Fetch chamada detail: students with P/F status and sequencia IDs.
   * Uses relatorio_detalhamento_chamada.php for full data including sequencia.
   */
  async fetchDetail(
    credentials: SgeCredentials,
    params: {
      serie: number;
      turma: number;
      turno: string;
      disciplina: number;
      data: string; // YYYY-MM-DD
      ano: number;
    }
  ): Promise<SgeChamadaDetail[]> {
    const html = await sgeFetch(credentials, 'relatorio_detalhamento_chamada.php', {
      method: 'GET',
      queryParams: {
        serie: String(params.serie),
        turma: String(params.turma),
        turno: params.turno,
        disciplina: String(params.disciplina),
        data: toEAlunoDate(params.data),
        ano: String(params.ano),
      },
    });
    return parseChamadaDetail(html);
  },

  /**
   * Check if chamada exists for given params (batch).
   */
  async checkExists(
    credentials: SgeCredentials,
    params: { serie: number; turma: number; turno: string; ano: number }
  ): Promise<{ exists: boolean; presentIds: number[] }> {
    const html = await sgeFetch(credentials, 'show_chamadas.php', {
      queryParams: {
        serie: String(params.serie),
        turma: String(params.turma),
        turno: params.turno,
        ano: String(params.ano),
      },
      body: new URLSearchParams({ show: '1' }),
    });
    const presentIds = parseCheckedCheckboxes(html);
    return { exists: presentIds.length > 0, presentIds };
  },
};

// ========== HTML Parsing Helpers ==========

function parseCmbSerieOptions(html: string): SgeSerieOption[] {
  const results: SgeSerieOption[] = [];
  const selectMatch = html.match(/<select[^>]*id=["']cmbSerie["'][^>]*>([\s\S]*?)<\/select>/i);
  if (!selectMatch) return results;
  const optionRegex = /<option\s+value=["'](\d+)["']\s+data-name=["']([^"']+)["']\s+data-code=["'](\d+)["'][^>]*>\s*([^<]+?)\s*<\/option>/gi;
  let match;
  while ((match = optionRegex.exec(selectMatch[1])) !== null) {
    const serie = parseInt(match[1], 10);
    const turno = match[2].trim();
    const turma = parseInt(match[3], 10);
    const label = match[4].trim();
    if (serie > 0 && turma > 0) results.push({ serie, turma, turno, label });
  }
  return results;
}

function parseStudentList(html: string): SgeStudent[] {
  const students: SgeStudent[] = [];
  const seen = new Set<number>();
  const regex = /openOcorrencia\((\d+),\s*'([^']+)'\)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const id = parseInt(match[1], 10);
    const nome = match[2].trim();
    if (id && nome && !seen.has(id)) {
      seen.add(id);
      students.push({ id, nome });
    }
  }
  return students;
}

function parseCheckedCheckboxes(html: string): number[] {
  const ids: number[] = [];
  const regex = /<input[^>]*value=['"](\d+)['"][^>]*checked[^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) ids.push(parseInt(match[1], 10));
  // Reverse attribute order
  const regex2 = /<input[^>]*checked[^>]*value=['"](\d+)['"][^>]*>/gi;
  while ((match = regex2.exec(html)) !== null) {
    const id = parseInt(match[1], 10);
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

/**
 * Parse relatorio_detalhamento_chamada.php HTML.
 * Each row: student name + P/F status + editChamada buttons with sequencia.
 *
 * HTML pattern:
 * <td style='text-align: left'> STUDENT NAME</td>
 * <td align='center'>P</td>
 * <td><button ... onClick='editChamada(".","2091809")'> ...
 */
function parseChamadaDetail(html: string): SgeChamadaDetail[] {
  const results: SgeChamadaDetail[] = [];
  // Match rows in the myTablePresence table
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const row = rowMatch[1];

    // Extract student name
    const nameMatch = row.match(/<td[^>]*style='text-align:\s*left'[^>]*>\s*([A-ZÀ-Ú][A-ZÀ-Ú\s]+[A-ZÀ-Ú])\s*<\/td>/i);
    if (!nameMatch) continue;

    // Extract status (P or F)
    const statusMatch = row.match(/<td[^>]*align='center'[^>]*>\s*([PF])\s*<\/td>/i);

    // Extract sequencia from editChamada(".","{sequencia}")
    const seqMatch = row.match(/editChamada\(["'][^"']*["'],\s*["'](\d+)["']\)/);

    // Extract student ID from the sequencia or checkbox
    const idMatch = row.match(/value=['"](\d+)['"]/);

    results.push({
      id: idMatch ? parseInt(idMatch[1], 10) : 0,
      nome: nameMatch[1].trim(),
      presente: statusMatch ? statusMatch[1] === 'P' : true,
      sequencia: seqMatch ? seqMatch[1] : undefined,
    });
  }

  return results;
}
```

**Step 2: Commit**

```bash
git add src/lib/sge/chamadaClient.ts
git commit -m "feat(sge): Add chamada client with CRUD and detail parsing"
```

---

### Task 4: Conteudo Client (`src/lib/sge/conteudoClient.ts`)

**Files:**
- Create: `src/lib/sge/conteudoClient.ts`

**Step 1: Create conteudo client**

```typescript
// src/lib/sge/conteudoClient.ts
import { sgeFetch, sgeFetchJSON, toEAlunoDate } from './client';
import type { SgeCredentials } from './client';

export interface SgeConteudo {
  id: string;        // sequencia
  conteudo: string;
  data?: string;
}

export const conteudoClient = {
  /**
   * Insert conteudo for a class.
   */
  async create(
    credentials: SgeCredentials,
    params: {
      data: string;      // YYYY-MM-DD
      aula: number;
      serie: number;
      turma: number;
      turno: string;
      disciplina: number;
      ano: number;
      conteudo: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const text = await sgeFetch(credentials, 'insert_conteudo.php', {
      body: new URLSearchParams({
        data: toEAlunoDate(params.data),
        aula: String(params.aula),
        serie: String(params.serie),
        turma: String(params.turma),
        turno: params.turno,
        disciplina: String(params.disciplina),
        ano: String(params.ano),
        conteudo: params.conteudo,
        add: '1',
      }),
    });
    const success = text.trim() === '0';
    return { success, message: success ? 'Conteudo registrado no SGE' : text.trim() };
  },

  /**
   * Get conteudo by ID.
   */
  async get(
    credentials: SgeCredentials,
    id: string
  ): Promise<SgeConteudo | null> {
    try {
      const json = await sgeFetchJSON<{ conteudo: string; sequencia: string }>(
        credentials, 'get_conteudo.php',
        { body: new URLSearchParams({ id, get: '1' }) }
      );
      return { id: json.sequencia, conteudo: json.conteudo };
    } catch {
      return null;
    }
  },

  /**
   * Edit conteudo.
   */
  async edit(
    credentials: SgeCredentials,
    params: { sequencia: string; conteudo: string }
  ): Promise<{ success: boolean }> {
    const text = await sgeFetch(credentials, 'edit_conteudo.php', {
      body: new URLSearchParams({
        conteudo: params.conteudo,
        sequencia: params.sequencia,
        edit: '1',
      }),
    });
    return { success: !text.toLowerCase().includes('erro') };
  },

  /**
   * Delete conteudo.
   */
  async delete(
    credentials: SgeCredentials,
    id: string
  ): Promise<{ success: boolean }> {
    const text = await sgeFetch(credentials, 'delete_conteudo.php', {
      body: new URLSearchParams({ id, del: '1' }),
    });
    return { success: !text.toLowerCase().includes('erro') };
  },

  /**
   * Parse conteudos from relatorio_detalhamento_chamada.php HTML.
   * The page has a second table #myTableContent with conteudo rows.
   */
  parseFromDetailHtml(html: string): SgeConteudo[] {
    const results: SgeConteudo[] = [];
    // Find the myTableContent table
    const tableMatch = html.match(/<table[^>]*id=["']myTableContent["'][^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) return results;

    // Extract rows from tbody
    const tbodyMatch = tableMatch[1].match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) return results;

    const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
    let match;
    while ((match = rowRegex.exec(tbodyMatch[1])) !== null) {
      const tdMatch = match[1].match(/<td[^>]*>([\s\S]*?)<\/td>/i);
      if (tdMatch) {
        const text = tdMatch[1].replace(/<[^>]*>/g, '').trim();
        if (text) {
          // Try to extract ID from edit/delete buttons if present
          const idMatch = match[1].match(/(?:deleteConteudo|openFormDadosConteudoEdit)\((\d+)\)/);
          results.push({ id: idMatch ? idMatch[1] : '', conteudo: text });
        }
      }
    }
    return results;
  },
};
```

**Step 2: Commit**

```bash
git add src/lib/sge/conteudoClient.ts
git commit -m "feat(sge): Add conteudo client with CRUD operations"
```

---

### Task 5: Ocorrencia Client (`src/lib/sge/ocorrenciaClient.ts`)

**Files:**
- Create: `src/lib/sge/ocorrenciaClient.ts`

**Step 1: Create ocorrencia client**

```typescript
// src/lib/sge/ocorrenciaClient.ts
import { sgeFetch, sgeFetchJSON } from './client';
import type { SgeCredentials } from './client';

export interface SgeOcorrencia {
  id: number;
  aluno: string;
  serie: string;
  motivo: string;
  usuario: string;
  data: string;
  status: 'aberta' | 'aprovada' | 'cancelada';
  // Only for approved
  aprovadaPor?: string;
  aprovadaEm?: string;
  // Only for cancelled
  canceladaPor?: string;
  canceladaEm?: string;
}

export const ocorrenciaClient = {
  /**
   * Create or update ocorrencia.
   * codigo=0 creates new, codigo>0 updates existing.
   */
  async save(
    credentials: SgeCredentials,
    params: {
      codigo?: number;  // 0 = new
      alunoSgeId: number;
      motivo: string;
      ano: number;
    }
  ): Promise<{ success: boolean; message: string }> {
    const text = await sgeFetch(credentials, 'insert_update_ocorrencia.php', {
      body: new URLSearchParams({
        codigo: String(params.codigo || 0),
        aluno: String(params.alunoSgeId),
        motivo: params.motivo,
        ano: String(params.ano),
        add: '1',
      }),
    });
    const success = text.trim() === '0';
    return { success, message: success ? 'Ocorrencia registrada no SGE' : text.trim() };
  },

  /**
   * Get ocorrencia details.
   */
  async get(
    credentials: SgeCredentials,
    id: number
  ): Promise<{ motivo: string } | null> {
    try {
      return await sgeFetchJSON<{ motivo: string }>(
        credentials, 'get_ocorrencia.php',
        { body: new URLSearchParams({ id: String(id), get: '1' }) }
      );
    } catch {
      return null;
    }
  },

  /**
   * Update ocorrencia status (aprovar/cancelar).
   */
  async updateStatus(
    credentials: SgeCredentials,
    params: { id: number; status: string }
  ): Promise<{ success: boolean }> {
    const text = await sgeFetch(credentials, 'update_status_ocorrencia.php', {
      body: new URLSearchParams({
        id: String(params.id),
        status: params.status,
      }),
    });
    return { success: !text.toLowerCase().includes('erro') };
  },

  /**
   * Fetch all ocorrencias from the page, parsed from 3 tabs.
   */
  async fetchAll(
    credentials: SgeCredentials,
    ano: number
  ): Promise<{
    abertas: SgeOcorrencia[];
    aprovadas: SgeOcorrencia[];
    canceladas: SgeOcorrencia[];
  }> {
    const html = await sgeFetch(credentials, 'ocorrencias.php', {
      body: new URLSearchParams({ cmbAno: String(ano) }),
    });
    return parseOcorrenciasPage(html);
  },
};

// ========== HTML Parsing ==========

function parseOcorrenciasPage(html: string): {
  abertas: SgeOcorrencia[];
  aprovadas: SgeOcorrencia[];
  canceladas: SgeOcorrencia[];
} {
  const result = {
    abertas: [] as SgeOcorrencia[],
    aprovadas: [] as SgeOcorrencia[],
    canceladas: [] as SgeOcorrencia[],
  };

  // Parse each tab
  const tabs: Array<{ id: string; status: 'aberta' | 'aprovada' | 'cancelada' }> = [
    { id: 'abertas', status: 'aberta' },
    { id: 'aprovadas', status: 'aprovada' },
    { id: 'canceladas', status: 'cancelada' },
  ];

  for (const tab of tabs) {
    const tabRegex = new RegExp(
      `<div[^>]*id=["']${tab.id}["'][^>]*>([\\s\\S]*?)</div>\\s*(?:<div|$)`, 'i'
    );
    const tabMatch = html.match(tabRegex);
    if (!tabMatch) continue;

    const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tabMatch[1])) !== null) {
      const cells = [];
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
      }
      if (cells.length < 5) continue; // Skip header rows or empty

      // Extract ID from buttons (btnEditar, btnStatus)
      const idMatch = rowMatch[1].match(/btnEditar\((\d+)/);
      const id = idMatch ? parseInt(idMatch[1], 10) : 0;

      const ocorrencia: SgeOcorrencia = {
        id,
        aluno: cells[1] || '',
        serie: cells[2] || '',
        motivo: cells[3] || '',
        usuario: cells[4] || '',
        data: cells[5] || '',
        status: tab.status,
      };

      if (tab.status === 'aprovada' && cells.length >= 8) {
        ocorrencia.aprovadaPor = cells[6];
        ocorrencia.aprovadaEm = cells[7];
      }
      if (tab.status === 'cancelada' && cells.length >= 8) {
        ocorrencia.canceladaPor = cells[6];
        ocorrencia.canceladaEm = cells[7];
      }

      result[tab.id as keyof typeof result].push(ocorrencia);
    }
  }

  return result;
}
```

**Step 2: Commit**

```bash
git add src/lib/sge/ocorrenciaClient.ts
git commit -m "feat(sge): Add ocorrencia client with CRUD and page parsing"
```

---

### Task 6: Relatorio Client (`src/lib/sge/relatorioClient.ts`)

**Files:**
- Create: `src/lib/sge/relatorioClient.ts`

**Step 1: Create relatorio client**

```typescript
// src/lib/sge/relatorioClient.ts
import { sgeFetch, toEAlunoDate } from './client';
import type { SgeCredentials } from './client';

export interface SgeRelatorioParams {
  serie: number;
  turma: number;
  turno: string;
  ano: number;
  // For detalhamento dia
  disciplina?: number;
  data?: string;       // YYYY-MM-DD
  // For mensal
  mes?: number;
  txtMes?: string;
  txtSerie?: string;
  // For assinatura
  txtDisciplina?: string;
}

export const relatorioClient = {
  /**
   * Fetch detalhamento da chamada (dia) - returns raw HTML.
   * Parsed natively in the frontend with MUI.
   */
  async fetchDetalhamentoDia(
    credentials: SgeCredentials,
    params: SgeRelatorioParams
  ): Promise<string> {
    return sgeFetch(credentials, 'relatorio_detalhamento_chamada.php', {
      method: 'GET',
      queryParams: {
        serie: String(params.serie),
        turma: String(params.turma),
        turno: params.turno,
        disciplina: String(params.disciplina || ''),
        data: params.data ? toEAlunoDate(params.data) : '',
        ano: String(params.ano),
      },
    });
  },

  /**
   * Fetch detalhamento mensal - returns raw HTML.
   * Parsed natively in the frontend with MUI.
   */
  async fetchDetalhamentoMensal(
    credentials: SgeCredentials,
    params: SgeRelatorioParams
  ): Promise<string> {
    return sgeFetch(credentials, 'relatorio_detalhamento_mensal.php', {
      method: 'GET',
      queryParams: {
        serie: String(params.serie),
        turma: String(params.turma),
        turno: params.turno,
        disciplina: String(params.disciplina || ''),
        mes: String(params.mes || ''),
        txtMes: params.txtMes || '',
        txtSerie: params.txtSerie || '',
        ano: String(params.ano),
      },
    });
  },

  /**
   * Fetch relatorio as proxied HTML (for iframe rendering).
   * Strips scripts, injects inline CSS.
   */
  async fetchProxiedReport(
    credentials: SgeCredentials,
    tipo: 'faltas' | 'analise_anual' | 'assinatura' | 'listagem_assinatura',
    params: SgeRelatorioParams & { titulo?: string }
  ): Promise<string> {
    const endpoints: Record<string, string> = {
      faltas: 'relatorio_de_faltas.php',
      analise_anual: 'relatorio_de_analise_anual.php',
      assinatura: 'relatorio_de_assinatura.php',
      listagem_assinatura: 'relatorio_listagem_de_assinatura.php',
    };

    const queryParams: Record<string, string> = {
      serie: String(params.serie),
      turma: String(params.turma),
      turno: params.turno,
      ano: String(params.ano),
    };

    if (params.txtSerie) queryParams.txtSerie = params.txtSerie;
    if (params.disciplina) queryParams.disciplina = String(params.disciplina);
    if (params.txtDisciplina) queryParams.txtDisciplina = params.txtDisciplina;
    if (params.mes) queryParams.mes = String(params.mes);
    if (params.txtMes) queryParams.txtMes = params.txtMes;
    if (params.titulo) queryParams.titulo = params.titulo;

    const html = await sgeFetch(credentials, endpoints[tipo], {
      method: 'GET',
      queryParams,
    });

    return sanitizeHtml(html);
  },
};

/**
 * Sanitize HTML from e-aluno for safe rendering:
 * - Remove <script> tags
 * - Remove external JS references
 * - Keep CSS and table structure
 */
function sanitizeHtml(html: string): string {
  return html
    // Remove script tags and content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Remove inline event handlers
    .replace(/\s+on\w+=['"][^'"]*['"]/gi, '')
    // Remove external resource references that would fail (relative URLs)
    .replace(/src=["'](?!https?:\/\/)[^"']*["']/gi, 'src=""')
    // Keep everything else (CSS, tables, structure)
    ;
}
```

**Step 2: Finalize index.ts with all exports**

```typescript
// src/lib/sge/index.ts
export { getSession, invalidateSession, encryptPassword, decryptPassword } from './session';
export { sgeFetch, sgeFetchJSON, toEAlunoDate } from './client';
export type { SgeCredentials } from './client';
export { chamadaClient } from './chamadaClient';
export type { SgeSerieOption, SgeStudent, SgeChamadaDetail } from './chamadaClient';
export { conteudoClient } from './conteudoClient';
export type { SgeConteudo } from './conteudoClient';
export { ocorrenciaClient } from './ocorrenciaClient';
export type { SgeOcorrencia } from './ocorrenciaClient';
export { relatorioClient } from './relatorioClient';
export type { SgeRelatorioParams } from './relatorioClient';
```

**Step 3: Commit**

```bash
git add src/lib/sge/relatorioClient.ts src/lib/sge/index.ts
git commit -m "feat(sge): Add relatorio client and finalize sge index exports"
```

---

## Phase 2: API Routes

### Task 7: SGE API Routes

**Files:**
- Create: `src/app/api/sge/login/route.ts`
- Create: `src/app/api/sge/data/route.ts`
- Create: `src/app/api/sge/chamada/route.ts`
- Create: `src/app/api/sge/chamada-detail/route.ts`
- Create: `src/app/api/sge/chamada-edit/route.ts`
- Create: `src/app/api/sge/chamada-delete/route.ts`
- Create: `src/app/api/sge/check/route.ts`
- Create: `src/app/api/sge/conteudo/route.ts`
- Create: `src/app/api/sge/ocorrencia/route.ts`
- Create: `src/app/api/sge/relatorio/route.ts`

Each route follows the same pattern: parse body → build SgeCredentials → call client method → return JSON. The key difference from `/api/ealuno/*` is that credentials go through the session pool automatically.

**Step 1: Create all API routes**

All routes follow this template pattern:

```typescript
// Template for all routes:
import { NextRequest, NextResponse } from 'next/server';
import { decryptPassword } from '@/lib/sge';
// + import specific client

function getCredentials(body: { user: string; password: string; encrypted?: boolean }) {
  const password = body.encrypted ? decryptPassword(body.password) : body.password;
  return { user: body.user, password };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.user || !body.password) {
      return NextResponse.json({ error: 'Credenciais obrigatorias' }, { status: 400 });
    }
    const credentials = getCredentials(body);
    // ... call client method
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro SGE';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Route-specific details:**

**`/api/sge/login/route.ts`** - Calls `chamadaClient.fetchPageOptions(credentials)`. Returns `{ options }`.

**`/api/sge/data/route.ts`** - Accepts `fetch: 'disciplinas' | 'alunos' | 'both'` + serie/turma/turno/ano. Calls respective `chamadaClient` methods.

**`/api/sge/chamada/route.ts`** - Accepts `presentStudentIds` or `alunoMap + presencas` or `absentStudentIds`. Calls `chamadaClient.submit()`.

**`/api/sge/chamada-detail/route.ts`** - Accepts serie/turma/turno/disciplina/data/ano. Calls `chamadaClient.fetchDetail()`.

**`/api/sge/chamada-edit/route.ts`** - Accepts `parametro` + `sequencia`. Calls `chamadaClient.edit()`.

**`/api/sge/chamada-delete/route.ts`** - Accepts serie/turma/turno/disciplina/data. Calls `chamadaClient.delete()`.

**`/api/sge/check/route.ts`** - Accepts `chamadas[]` array. Loops `chamadaClient.checkExists()` for each.

**`/api/sge/conteudo/route.ts`** - Accepts `action: 'create' | 'edit' | 'delete' | 'get'` + params. Routes to `conteudoClient` methods.

**`/api/sge/ocorrencia/route.ts`** - Accepts `action: 'create' | 'edit' | 'status' | 'get' | 'list'` + params. Routes to `ocorrenciaClient` methods.

**`/api/sge/relatorio/route.ts`** - Supports POST for parsed reports and GET for proxied HTML. Accepts `tipo` + params.

**Step 2: Commit**

```bash
git add src/app/api/sge/
git commit -m "feat(sge): Add all 10 API routes for SGE integration"
```

---

## Phase 3: Firestore Types & Services

### Task 8: Update Types

**Files:**
- Modify: `src/types/index.ts` (lines 383-403 for Ocorrencia, lines 716-766 for EAluno types)

**Step 1: Add new fields to Chamada type**

Find the `Chamada` interface and add after `sgeSyncedAt`:
```typescript
  sgeSyncError?: string;
  sgeSequenciaMap?: Record<string, string>; // alunoId → sequencia no e-aluno
```

**Step 2: Add new fields to Ocorrencia type**

Add after `updatedAt` in the Ocorrencia interface (line ~403):
```typescript
  // SGE sync
  sgeId?: number;
  sgeSyncedAt?: Date;
  sgeSyncError?: string;
  sgeStatus?: 'aberta' | 'aprovada' | 'cancelada';
```

**Step 3: Add ConteudoAula type**

Add after the Ocorrencia interfaces:
```typescript
export interface ConteudoAula {
  id: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  data: Date;
  tempo: number;
  conteudo: string;
  ano: number;
  // SGE sync
  sgeId?: string;
  sgeSyncedAt?: Date;
  sgeSyncError?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Step 4: Add SgeConfig alias**

After the existing EAluno interfaces:
```typescript
/** @alias for EAlunoConfig - new name for SGE integration */
export type SgeConfig = EAlunoConfig;
```

**Step 5: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(sge): Add ConteudoAula type, SGE fields on Chamada and Ocorrencia"
```

---

### Task 9: ConteudoAula Firestore Service

**Files:**
- Create: `src/services/firestore/conteudoService.ts`
- Modify: `src/services/firestore/index.ts` (add export)

**Step 1: Create conteudo service**

```typescript
// src/services/firestore/conteudoService.ts
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
} from './base';
import { ConteudoAula } from '@/types';

const COLLECTION = 'conteudos';

export const conteudoAulaService = {
  async getByTurmaAndDate(
    turmaId: string,
    disciplinaId: string,
    data: Date,
    ano: number
  ): Promise<ConteudoAula[]> {
    return getDocuments<ConteudoAula>(COLLECTION, [
      where('turmaId', '==', turmaId),
      where('disciplinaId', '==', disciplinaId),
      where('ano', '==', ano),
      where('data', '==', data),
      orderBy('tempo', 'asc'),
    ]);
  },

  async getByProfessorAndPeriod(
    professorId: string,
    ano: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<ConteudoAula[]> {
    const constraints = [
      where('professorId', '==', professorId),
      where('ano', '==', ano),
    ];
    if (startDate) constraints.push(where('data', '>=', startDate));
    if (endDate) constraints.push(where('data', '<=', endDate));
    constraints.push(orderBy('data', 'desc'));
    return getDocuments<ConteudoAula>(COLLECTION, constraints);
  },

  async create(data: Omit<ConteudoAula, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return createDocument(COLLECTION, {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },

  async update(id: string, data: Partial<ConteudoAula>): Promise<void> {
    return updateDocument(COLLECTION, id, {
      ...data,
      updatedAt: new Date(),
    });
  },

  async delete(id: string): Promise<void> {
    return deleteDocument(COLLECTION, id);
  },
};
```

**Step 2: Add export to `src/services/firestore/index.ts`**

Add line:
```typescript
export { conteudoAulaService } from './conteudoService';
```

**Step 3: Commit**

```bash
git add src/services/firestore/conteudoService.ts src/services/firestore/index.ts
git commit -m "feat(sge): Add conteudoAulaService for Firestore CRUD"
```

---

## Phase 4: Frontend Migration

### Task 10: Migrate ChamadaList with SGE Status Chips

**Files:**
- Modify: `src/app/diario/chamada/components/ChamadaList.tsx`

**Step 1: Add SGE status chip to each chamada row**

Add a Chip component next to each chamada that shows sync status based on `sgeSyncedAt`, `sgeSyncError`, and a `syncingIds` set passed from parent:

```typescript
// Inside the chamada row render, after the existing content:
{chamada.sgeSyncedAt && !chamada.sgeSyncError && (
  <Chip label="SGE ✓" color="success" size="small" sx={{ ml: 1 }} />
)}
{chamada.sgeSyncError && (
  <Tooltip title={chamada.sgeSyncError}>
    <Chip label="SGE ✗" color="error" size="small" sx={{ ml: 1 }} />
  </Tooltip>
)}
{syncingIds?.has(chamada.id) && (
  <Chip label="SGE ⟳" color="warning" size="small" sx={{ ml: 1 }} />
)}
```

Add prop `syncingIds?: Set<string>` to the ChamadaList props interface.

**Step 2: Commit**

```bash
git add src/app/diario/chamada/components/ChamadaList.tsx
git commit -m "feat(sge): Add SGE sync status chips to ChamadaList"
```

---

### Task 11: Fire-and-Forget Sync in Chamada Page

**Files:**
- Modify: `src/app/diario/chamada/page.tsx`

**Step 1: Replace `/api/ealuno/*` calls with `/api/sge/*`**

In `page.tsx`, update all fetch calls:
- `/api/ealuno/login` → `/api/sge/login`
- `/api/ealuno/chamada` → `/api/sge/chamada`
- `/api/ealuno/data` → `/api/sge/data`

**Step 2: Implement fire-and-forget sync**

After saving chamada to Firestore (the existing `handleSalvarChamada` flow), trigger SGE sync without awaiting:

```typescript
// After successful Firestore save:
if (eAlunoConfig?.credentials?.user) {
  // Fire-and-forget - don't await
  syncChamadaToSGE(chamadaId, chamadaData).catch(err => {
    console.error('[SGE] Sync failed:', err);
  });
}
```

The `syncChamadaToSGE` function handles auto-mapping and calls `/api/sge/chamada`, then updates the chamada document with `sgeSyncedAt` or `sgeSyncError`.

**Step 3: Add `syncingIds` state and pass to ChamadaList**

```typescript
const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
// ... in syncChamadaToSGE:
setSyncingIds(prev => new Set([...prev, chamadaId]));
// ... after sync completes:
setSyncingIds(prev => { const next = new Set(prev); next.delete(chamadaId); return next; });
```

**Step 4: Commit**

```bash
git add src/app/diario/chamada/page.tsx
git commit -m "feat(sge): Implement fire-and-forget chamada sync to SGE"
```

---

### Task 12: Rename EAlunoConfigModal → SgeConfigModal

**Files:**
- Modify: `src/app/diario/chamada/components/EAlunoConfigModal.tsx` (rename + update imports)
- Modify: `src/app/diario/chamada/components/index.ts` (update export)
- Modify: `src/app/diario/chamada/page.tsx` (update import)

**Step 1: Update EAlunoConfigModal.tsx**

- Rename component function to `SgeConfigModal`
- Update import from `@/services/firestore/eAlunoConfigService` (keep using same service, just rename the component)
- Update all internal fetch calls from `/api/ealuno/login` → `/api/sge/login`
- Update dialog title from "Configurar e-aluno (SGE)" → "Configurar SGE"

**Step 2: Update index.ts export**

Replace:
```typescript
export { EAlunoConfigModal } from './EAlunoConfigModal';
```
With:
```typescript
export { SgeConfigModal } from './EAlunoConfigModal';
```

**Step 3: Update page.tsx import**

Replace `EAlunoConfigModal` with `SgeConfigModal` in import and JSX.

**Step 4: Commit**

```bash
git add src/app/diario/chamada/components/EAlunoConfigModal.tsx src/app/diario/chamada/components/index.ts src/app/diario/chamada/page.tsx
git commit -m "refactor(sge): Rename EAlunoConfigModal to SgeConfigModal"
```

---

### Task 13: Migrate RelatorioSGE to New API

**Files:**
- Modify: `src/app/diario/chamada/components/relatorios/RelatorioSGE.tsx`

**Step 1: Update all fetch calls**

Replace:
- `/api/ealuno/login` → `/api/sge/login`
- `/api/ealuno/data` → `/api/sge/data`
- `/api/ealuno/check` → `/api/sge/check`
- `/api/ealuno/chamada` → `/api/sge/chamada`

No logic changes needed - the API contract is the same.

**Step 2: Commit**

```bash
git add src/app/diario/chamada/components/relatorios/RelatorioSGE.tsx
git commit -m "refactor(sge): Migrate RelatorioSGE to /api/sge/* routes"
```

---

### Task 14: Add Conteudo UI to Chamada Page

**Files:**
- Create: `src/app/diario/chamada/components/ConteudoAulaSection.tsx`
- Modify: `src/app/diario/chamada/components/index.ts` (add export)
- Modify: `src/app/diario/chamada/page.tsx` (add section)

**Step 1: Create ConteudoAulaSection component**

Component shows:
- TextField multiline for conteudo text
- Save button that calls `conteudoAulaService.create()` + fire-and-forget to `/api/sge/conteudo`
- List of existing conteudos for the selected date/turma/disciplina
- SGE sync chip per conteudo

Props: `turmaId, disciplinaId, professorId, data, ano, eAlunoConfig`

**Step 2: Add to chamada page**

Below the chamada list, add the ConteudoAulaSection when a turma+disciplina+date is selected.

**Step 3: Commit**

```bash
git add src/app/diario/chamada/components/ConteudoAulaSection.tsx src/app/diario/chamada/components/index.ts src/app/diario/chamada/page.tsx
git commit -m "feat(sge): Add ConteudoAula section with SGE sync"
```

---

### Task 15: Add SGE Sync to Ocorrencias Page

**Files:**
- Modify: `src/app/diario/ocorrencias/page.tsx`

**Step 1: Add fire-and-forget SGE sync**

After creating/editing an ocorrencia in Firestore, fire-and-forget call to `/api/sge/ocorrencia` if the user has SGE config.

**Step 2: Add "Consultar SGE" button**

Button that calls `/api/sge/ocorrencia { action: 'list' }` and shows results in a dialog with "Importar" option.

**Step 3: Add SGE status chips to ocorrencia list**

Show `sgeSyncedAt` / `sgeSyncError` status.

**Step 4: Commit**

```bash
git add src/app/diario/ocorrencias/page.tsx
git commit -m "feat(sge): Add SGE sync to ocorrencias page"
```

---

### Task 16: Add SGE Relatorios Tab

**Files:**
- Modify: `src/app/diario/chamada/components/relatorios/RelatorioConsultaDia.tsx`
- Modify: `src/app/diario/chamada/components/relatorios/RelatorioMensal.tsx`
- Modify: `src/app/diario/chamada/components/RelatoriosChamada.tsx`

**Step 1: Update RelatorioConsultaDia to use `/api/sge/chamada-detail`**

Replace existing `/api/ealuno/chamada-detail` calls.

**Step 2: Update RelatorioMensal to use `/api/sge/relatorio`**

Replace existing calls.

**Step 3: Add proxy report buttons in RelatoriosChamada**

Add buttons for "Faltas Bimestrais" and "Analise Anual" that open proxied reports via `/api/sge/relatorio?tipo=...` in new tab.

**Step 4: Commit**

```bash
git add src/app/diario/chamada/components/relatorios/ src/app/diario/chamada/components/RelatoriosChamada.tsx
git commit -m "feat(sge): Migrate relatorios to /api/sge/* and add proxy reports"
```

---

## Phase 5: Cleanup

### Task 17: Delete Legacy Code

**Files:**
- Delete: `src/lib/eAlunoProxy.ts`
- Delete: `src/app/api/ealuno/login/route.ts`
- Delete: `src/app/api/ealuno/chamada/route.ts`
- Delete: `src/app/api/ealuno/chamada-detail/route.ts`
- Delete: `src/app/api/ealuno/check/route.ts`
- Delete: `src/app/api/ealuno/data/route.ts`
- Delete: directory `src/app/api/ealuno/`

**Step 1: Verify no remaining imports**

Run: `grep -r "eAlunoProxy\|/api/ealuno" src/ --include="*.ts" --include="*.tsx"`

Expected: No results (all migrated in previous tasks).

**Step 2: Delete files**

```bash
rm src/lib/eAlunoProxy.ts
rm -rf src/app/api/ealuno/
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore(sge): Remove legacy eAlunoProxy and /api/ealuno routes"
```

---

### Task 18: Build Verification

**Step 1: Run build**

```bash
npx next build
```

Expected: Build succeeds with no errors.

**Step 2: Fix any build errors**

Address TypeScript errors, missing imports, etc.

**Step 3: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix(sge): Fix build errors from SGE migration"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-6 | SGE Service Layer (session, client, 4 sub-clients) |
| 2 | 7 | 10 API routes under /api/sge/ |
| 3 | 8-9 | Firestore types + conteudo service |
| 4 | 10-16 | Frontend migration (chips, fire-and-forget, conteudo, ocorrencias, relatorios) |
| 5 | 17-18 | Delete legacy code + build verification |

Total: 18 tasks. Phase 1-3 can be built without touching existing functionality. Phase 4 migrates the frontend. Phase 5 cleans up.
