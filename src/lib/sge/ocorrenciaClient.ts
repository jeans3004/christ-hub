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
