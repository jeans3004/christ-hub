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
