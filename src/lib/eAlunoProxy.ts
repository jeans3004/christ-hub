/**
 * Server-side proxy for e-aluno (SGE externo).
 * Handles HTTP requests to e-aluno.com.br with session management.
 * This file should ONLY be imported by API routes (server-side).
 */

import crypto from 'crypto';

const BASE_URL = 'https://e-aluno.com.br/christ/diario';
const ENCRYPTION_KEY = process.env.EALUNO_ENCRYPTION_KEY || 'luminar-sge-default-key-2026';

// ========== Encryption ==========

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

// ========== Session Management ==========

interface EAlunoSession {
  cookie: string;
}

/**
 * Login to e-aluno and get session cookie.
 */
export async function eAlunoLogin(user: string, password: string): Promise<EAlunoSession> {
  // Strip non-alphanumeric from user (CPF cleanup, same as e-aluno JS)
  const cleanUser = user.replace(/[^a-zA-Z0-9]/g, '');

  const res = await fetch(`${BASE_URL}/flogin.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ user: cleanUser, user_password: password }),
    redirect: 'manual',
  });

  // Extract session cookie
  const setCookies = res.headers.getSetCookie?.() || [];
  const phpSession = setCookies
    .map(c => c.split(';')[0])
    .filter(c => c.startsWith('PHPSESSID='))
    .join('; ');

  if (!phpSession) {
    // Try getting from all cookies
    const allCookies = setCookies.map(c => c.split(';')[0]).join('; ');
    if (!allCookies) {
      throw new Error('Nenhum cookie de sessao retornado');
    }
    // Check if login was successful
    const body = await res.text();
    if (body.trim() !== '0') {
      throw new Error('Credenciais invalidas');
    }
    return { cookie: allCookies };
  }

  const body = await res.text();
  if (body.trim() !== '0') {
    throw new Error('Credenciais invalidas');
  }

  return { cookie: phpSession };
}

// ========== Data Fetching ==========

/**
 * Combined option from cmbSerie dropdown.
 * Each option encodes serie + turma + turno in one element:
 * <option value="11" data-name="Matutino" data-code="7"> 6º Ano - EF II [ Matutino A ] </option>
 */
export interface EAlunoSerieOption {
  serie: number;
  turma: number;
  turno: string;
  label: string;
}

/**
 * Fetch chamadas.php page and parse the combined cmbSerie dropdown.
 */
export async function eAlunoFetchPageData(session: EAlunoSession): Promise<{
  options: EAlunoSerieOption[];
  rawHtml: string;
}> {
  const res = await fetch(`${BASE_URL}/chamadas.php`, {
    headers: { Cookie: session.cookie },
  });

  const html = await res.text();

  // Check if redirected to login
  if (html.includes("location.href='index.html'") || html.includes('flogin.php')) {
    throw new Error('Sessao expirada');
  }

  const options = parseCmbSerieOptions(html);

  return { options, rawHtml: html };
}

/**
 * Fetch disciplinas for a given serie/turma/turno/ano.
 */
export async function eAlunoFetchDisciplinas(
  session: EAlunoSession,
  serie: number,
  turma: number,
  turno: string,
  ano: number
): Promise<Array<{ id: number; nome: string }>> {
  const res = await fetch(`${BASE_URL}/get_disciplinas_chamada.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: session.cookie,
    },
    body: new URLSearchParams({
      serie: String(serie),
      turma: String(turma),
      turno,
      ano: String(ano),
      show: '1',
    }),
  });

  const text = await res.text();

  // Response is JSON: [{"disciplina":"24","descricao":"PENSAMENTO COMPUTACIONAL"}]
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) {
      return json.map((d: { disciplina?: string; descricao?: string; id?: number; nome?: string }) => ({
        id: parseInt(String(d.disciplina || d.id || '0'), 10),
        nome: (d.descricao || d.nome || '').trim(),
      })).filter(d => d.id > 0);
    }
  } catch {
    // Not JSON, try parsing as HTML options
  }

  return [];
}

/**
 * Fetch students list for a given serie/turma/turno/ano.
 * Returns student IDs and names parsed from the HTML response.
 */
export async function eAlunoFetchStudents(
  session: EAlunoSession,
  serie: number,
  turma: number,
  turno: string,
  ano: number
): Promise<Array<{ id: number; nome: string }>> {
  const url = `${BASE_URL}/show_chamadas.php?serie=${serie}&turma=${turma}&turno=${encodeURIComponent(turno)}&ano=${ano}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: session.cookie,
    },
    body: 'show=1',
  });

  const html = await res.text();
  return parseStudentList(html);
}

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY (format expected by e-aluno PHP).
 */
function toEAlunoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Submit chamada (attendance) to e-aluno.
 */
export async function eAlunoSubmitChamada(
  session: EAlunoSession,
  params: {
    presentStudentIds: number[];
    data: string;      // YYYY-MM-DD
    aula: number;      // Period number
    serie: number;
    turma: number;
    turno: string;
    disciplina: number;
    ano: number;
  }
): Promise<{ success: boolean; message: string; responseBody?: string }> {
  const lista = params.presentStudentIds.join(',');
  const url = `${BASE_URL}/insert_chamada.php?lista=${encodeURIComponent(lista)}`;

  const dataBR = toEAlunoDate(params.data);

  console.log('[eAluno] Enviando chamada:', {
    url,
    data: dataBR,
    aula: params.aula,
    serie: params.serie,
    turma: params.turma,
    turno: params.turno,
    disciplina: params.disciplina,
    presentCount: params.presentStudentIds.length,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: session.cookie,
    },
    body: new URLSearchParams({
      data: dataBR,
      aula: String(params.aula),
      serie: String(params.serie),
      turma: String(params.turma),
      turno: params.turno,
      disciplina: String(params.disciplina),
      ano: String(params.ano),
      add: '1',
    }),
  });

  const text = await res.text();
  console.log('[eAluno] Resposta insert_chamada:', text.substring(0, 500));

  // e-aluno typically returns a success/error message or redirects
  const isError = text.toLowerCase().includes('erro') || text.toLowerCase().includes('error');

  return {
    success: !isError,
    message: isError ? text.trim() : 'Chamada registrada no e-aluno',
    responseBody: text.substring(0, 200),
  };
}

// ========== Chamada Status Check ==========

/**
 * Check if a chamada already exists in e-aluno for given params.
 * Fetches show_chamadas.php with data/disciplina/aula and checks
 * if any checkboxes are checked (indicating attendance was already recorded).
 */
export async function eAlunoFetchChamadaStatus(
  session: EAlunoSession,
  params: {
    serie: number;
    turma: number;
    turno: string;
    ano: number;
    data: string;       // YYYY-MM-DD
    disciplina: number;
    aula: number;
  }
): Promise<{ exists: boolean; presentIds: number[] }> {
  const url = `${BASE_URL}/show_chamadas.php?serie=${params.serie}&turma=${params.turma}&turno=${encodeURIComponent(params.turno)}&ano=${params.ano}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: session.cookie,
    },
    body: new URLSearchParams({
      data: toEAlunoDate(params.data),
      disciplina: String(params.disciplina),
      aula: String(params.aula),
      show: '1',
    }),
  });

  const html = await res.text();

  // Parse checkboxes: <input type='checkbox' value='5720' name='check' checked>
  const checkedRegex = /<input[^>]*type=['"]checkbox['"][^>]*value=['"](\d+)['"][^>]*checked[^>]*>/gi;
  const presentIds: number[] = [];
  let match;

  while ((match = checkedRegex.exec(html)) !== null) {
    presentIds.push(parseInt(match[1], 10));
  }

  // Also check reverse attribute order: checked before value
  const checkedRegex2 = /<input[^>]*checked[^>]*value=['"](\d+)['"][^>]*type=['"]checkbox['"][^>]*>/gi;
  while ((match = checkedRegex2.exec(html)) !== null) {
    const id = parseInt(match[1], 10);
    if (!presentIds.includes(id)) {
      presentIds.push(id);
    }
  }

  return {
    exists: presentIds.length > 0,
    presentIds,
  };
}

// ========== HTML Parsing Helpers ==========

/**
 * Parse the combined cmbSerie dropdown from chamadas.php.
 *
 * Actual HTML:
 * <option value="11" data-name="Matutino" data-code="7"> 6º Ano - Ensino Fundamental II [ Matutino A ] </option>
 *
 * - value = serie ID
 * - data-name = turno
 * - data-code = turma ID
 * - text = display label
 */
function parseCmbSerieOptions(html: string): EAlunoSerieOption[] {
  const results: EAlunoSerieOption[] = [];

  // Find the cmbSerie select
  const selectRegex = /<select[^>]*id=["']cmbSerie["'][^>]*>([\s\S]*?)<\/select>/i;
  const selectMatch = html.match(selectRegex);
  if (!selectMatch) return results;

  const optionsHtml = selectMatch[1];

  // Parse each option with value, data-name, data-code
  const optionRegex = /<option\s+value=["'](\d+)["']\s+data-name=["']([^"']+)["']\s+data-code=["'](\d+)["'][^>]*>\s*([^<]+?)\s*<\/option>/gi;
  let match;

  while ((match = optionRegex.exec(optionsHtml)) !== null) {
    const serie = parseInt(match[1], 10);
    const turno = match[2].trim();
    const turma = parseInt(match[3], 10);
    const label = match[4].trim();

    if (serie > 0 && turma > 0) {
      results.push({ serie, turma, turno, label });
    }
  }

  return results;
}

/**
 * Parse student list from show_chamadas.php HTML response.
 *
 * Actual HTML pattern from e-aluno:
 * <span onClick="openOcorrencia(5720,'ABRAHAO DE ALMEIDA BARBA');"> ABRAHAO DE ALMEIDA BARBA </span>
 * <input type='checkbox' value='5720' name='check' checked>
 */
function parseStudentList(html: string): Array<{ id: number; nome: string }> {
  const students: Array<{ id: number; nome: string }> = [];
  const seen = new Set<number>();

  // Primary strategy: extract from openOcorrencia(ID,'NAME') calls
  const ocorrenciaRegex = /openOcorrencia\((\d+),\s*'([^']+)'\)/g;
  let match;

  while ((match = ocorrenciaRegex.exec(html)) !== null) {
    const id = parseInt(match[1], 10);
    const nome = match[2].trim();
    if (id && nome && !seen.has(id)) {
      seen.add(id);
      students.push({ id, nome });
    }
  }

  // Fallback: parse checkbox values + span text from rows
  if (students.length === 0) {
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const row = rowMatch[1];
      const checkboxMatch = row.match(/value=['"](\d+)['"][^>]*name=['"]check['"]/)
        || row.match(/name=['"]check['"][^>]*value=['"](\d+)['"]/);
      if (!checkboxMatch) continue;

      const id = parseInt(checkboxMatch[1], 10);
      if (seen.has(id)) continue;

      // Extract name from span text
      const spanMatch = row.match(/<span[^>]*>\s*([A-ZÀ-Ú][A-ZÀ-Ú\s]+[A-ZÀ-Ú])\s*<\/span>/i);
      const nome = spanMatch ? spanMatch[1].trim() : '';

      if (id && nome) {
        seen.add(id);
        students.push({ id, nome });
      }
    }
  }

  return students;
}
