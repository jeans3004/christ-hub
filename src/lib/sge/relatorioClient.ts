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
