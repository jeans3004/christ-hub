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
