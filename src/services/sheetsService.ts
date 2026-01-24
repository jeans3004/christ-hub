/**
 * Servico para acessar Google Sheets.
 * Utiliza o token OAuth do Drive para ler planilhas de respostas do Google Forms.
 */

import { AREAS_CONHECIMENTO } from '@/constants';

// Tipos
export interface SheetRow {
  identificador: string;  // Email ou matricula
  nome: string;
  serie: string;
  areaEscolhida: string;
  areaSecundaria?: string;
  timestamp?: string;
}

export interface ImportError {
  linha: number;
  identificador: string;
  motivo: string;
}

export interface AlunoAtualizado {
  alunoId: string;
  nome: string;
  areaAnterior?: string;
  areaNova: string;
}

export interface SheetImportResult {
  total: number;
  processados: number;
  erros: ImportError[];
  atualizados: AlunoAtualizado[];
}

export interface HeaderMap {
  identificador: number;
  nome: number;
  serie: number;
  areaEscolhida: number;
  areaSecundaria: number;
  timestamp: number;
}

export const sheetsService = {
  /**
   * Busca dados de uma planilha Google Sheets.
   */
  async getSpreadsheetData(
    accessToken: string,
    spreadsheetId: string,
    range: string = 'A:Z'
  ): Promise<string[][]> {
    const response = await fetch(
      `/api/google/sheets?spreadsheetId=${encodeURIComponent(spreadsheetId)}&range=${encodeURIComponent(range)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Erro ao acessar planilha');
    }

    const data = await response.json();
    return data.values || [];
  },

  /**
   * Detecta colunas pelo header da planilha.
   */
  detectHeaderColumns(header: string[]): HeaderMap {
    const map: HeaderMap = {
      identificador: -1,
      nome: -1,
      serie: -1,
      areaEscolhida: -1,
      areaSecundaria: -1,
      timestamp: -1,
    };

    header.forEach((col, index) => {
      const c = col.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      // Identificador (email ou matricula)
      if (c.includes('email') || c.includes('matricula') || c.includes('aluno')) {
        if (map.identificador === -1) {
          map.identificador = index;
        }
      }

      // Nome
      if (c.includes('nome') && !c.includes('area') && map.nome === -1) {
        map.nome = index;
      }

      // Serie
      if ((c.includes('serie') || c.includes('ano') || c.includes('turma')) && map.serie === -1) {
        map.serie = index;
      }

      // Area
      if (c.includes('area') || c.includes('itinerario') || c.includes('trilha')) {
        if (map.areaEscolhida === -1) {
          map.areaEscolhida = index;
        } else if (map.areaSecundaria === -1) {
          map.areaSecundaria = index;
        }
      }

      // Timestamp
      if (c.includes('timestamp') || c.includes('carimbo') || c.includes('data') || c.includes('hora')) {
        if (map.timestamp === -1) {
          map.timestamp = index;
        }
      }
    });

    return map;
  },

  /**
   * Parseia linhas da planilha em objetos SheetRow.
   */
  parseRows(rows: string[][], headerMap: HeaderMap): SheetRow[] {
    // Pula header (primeira linha)
    return rows.slice(1)
      .filter(row => row.length > 0 && row.some(cell => cell?.trim()))
      .map((row) => ({
        identificador: row[headerMap.identificador]?.trim() || '',
        nome: row[headerMap.nome]?.trim() || '',
        serie: row[headerMap.serie]?.trim() || '',
        areaEscolhida: row[headerMap.areaEscolhida]?.trim() || '',
        areaSecundaria: headerMap.areaSecundaria >= 0 ? row[headerMap.areaSecundaria]?.trim() : undefined,
        timestamp: headerMap.timestamp >= 0 ? row[headerMap.timestamp]?.trim() : undefined,
      }));
  },

  /**
   * Normaliza texto de area para ID.
   */
  normalizeArea(areaTexto: string): string | null {
    const texto = areaTexto.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    // Tentar match exato por sigla primeiro
    for (const area of AREAS_CONHECIMENTO) {
      if (texto === area.sigla.toLowerCase()) {
        return area.id;
      }
    }

    // Depois tentar por nome parcial
    if (texto.includes('linguagens') || texto.includes('lingua') || texto === 'lin') {
      return 'linguagens';
    }
    if (texto.includes('matematica') || texto === 'mat') {
      return 'matematica';
    }
    if (texto.includes('natureza') || texto.includes('cnt') || texto.includes('ciencias da natureza') || texto.includes('biologia') || texto.includes('fisica') || texto.includes('quimica')) {
      return 'ciencias_natureza';
    }
    if (texto.includes('humanas') || texto.includes('chs') || texto.includes('ciencias humanas') || texto.includes('sociais')) {
      return 'ciencias_humanas';
    }
    if (texto.includes('tecnica') || texto.includes('profissional') || texto.includes('ftp') || texto.includes('formacao')) {
      return 'formacao_tecnica';
    }

    return null;
  },

  /**
   * Normaliza texto de serie para formato padrao.
   */
  normalizeSerie(serieTexto: string): string | null {
    const texto = serieTexto.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (texto.includes('1') || texto.includes('primeira')) {
      return '1ª Série';
    }
    if (texto.includes('2') || texto.includes('segunda')) {
      return '2ª Série';
    }
    if (texto.includes('3') || texto.includes('terceira')) {
      return '3ª Série';
    }

    return null;
  },

  /**
   * Extrai ID da planilha de uma URL do Google Sheets.
   */
  extractSpreadsheetId(url: string): string | null {
    // Formatos suportados:
    // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
    // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  },

  /**
   * Valida se a URL e uma URL valida do Google Sheets.
   */
  isValidSheetsUrl(url: string): boolean {
    return /docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/.test(url);
  },
};
