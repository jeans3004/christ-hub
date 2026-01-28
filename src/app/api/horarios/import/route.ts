/**
 * API para importar horarios de planilha Excel.
 * Recebe arquivo Excel no formato padrao e retorna dados estruturados.
 * Suporta tanto o formato antigo quanto o novo modelo simplificado.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Mapeamento de dias da semana
const DIA_MAP: Record<string, number> = {
  'SEGUNDA': 1,
  'TERÇA': 2,
  'TERCA': 2,
  'QUARTA': 3,
  'QUINTA': 4,
  'SEXTA': 5,
  'SABADO': 6,
  'SÁBADO': 6,
};

// Estrutura de uma entrada de horario parseada
export interface ParsedHorario {
  diaSemana: number;
  tempo: number;
  horaInicio: string;
  horaFim: string;
  turmaCode: string;
  turno: 'Matutino' | 'Vespertino';
  disciplinaNome: string;
}

// Resposta da API
export interface ImportParseResponse {
  success: boolean;
  data?: {
    horarios: ParsedHorario[];
    turmasEncontradas: string[];
    disciplinasEncontradas: string[];
    turnoMatutino: number;
    turnoVespertino: number;
  };
  error?: string;
}

// Normaliza horario para formato HH:MM
function normalizeTimeValue(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  return `${(h || '0').padStart(2, '0')}:${(m || '00').padStart(2, '0')}`;
}

// Extrai horario de string (varios formatos suportados)
function parseTimeRange(time: string): { inicio: string; fim: string } | null {
  if (!time || typeof time !== 'string') return null;

  const cleaned = time.replace(/\s+/g, ' ').trim();

  // Formato: "07:00 - 07:45" ou "7:00 - 7:45"
  let match = cleaned.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (match) {
    const [, h1, m1, h2, m2] = match;
    return {
      inicio: normalizeTimeValue(`${h1}:${m1}`),
      fim: normalizeTimeValue(`${h2}:${m2}`),
    };
  }

  // Formato: "7:00 a 7:45" ou "7:00 A 7:45"
  match = cleaned.match(/(\d{1,2}):(\d{2})\s*[aA]\s*(\d{1,2}):(\d{2})/);
  if (match) {
    const [, h1, m1, h2, m2] = match;
    return {
      inicio: normalizeTimeValue(`${h1}:${m1}`),
      fim: normalizeTimeValue(`${h2}:${m2}`),
    };
  }

  return null;
}

// Verifica se e uma disciplina valida
function isValidDisciplina(nome: string): boolean {
  if (!nome || typeof nome !== 'string') return false;
  const trimmed = nome.trim();
  return trimmed.length > 0 &&
         trimmed !== '-' &&
         trimmed !== '---' &&
         !trimmed.match(/^(DIA|TEMPO|HORÁRIO|HORARIO)$/i);
}

// Extrai codigo da turma
function extractTurmaCode(header: string): string {
  if (!header) return '';
  let trimmed = header.trim();

  // Se tem "/" pega apenas a primeira parte
  if (trimmed.includes('/')) {
    trimmed = trimmed.split('/')[0].trim();
  }

  // Remove "VESP" se existir
  trimmed = trimmed.replace(/\s*VESP\s*/gi, '').trim();

  return trimmed;
}

// Detecta o turno baseado no horario
function detectTurno(horaInicio: string): 'Matutino' | 'Vespertino' {
  const hora = parseInt(horaInicio.split(':')[0] || '0');
  return hora < 12 ? 'Matutino' : 'Vespertino';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum arquivo enviado',
      } as ImportParseResponse);
    }

    // Ler arquivo
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Procurar aba com horarios
    const sheetName = workbook.SheetNames.find(name =>
      name.includes('HORARIO') || name.includes('COLORIDO')
    ) || workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];
    const data: (string | number | null)[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: ''
    });

    if (data.length < 3) {
      return NextResponse.json({
        success: false,
        error: 'Planilha vazia ou formato invalido',
      } as ImportParseResponse);
    }

    const horarios: ParsedHorario[] = [];
    const turmasSet = new Set<string>();
    const disciplinasSet = new Set<string>();

    let currentTurno: 'Matutino' | 'Vespertino' = 'Matutino';
    let currentDia: number | null = null;
    let turmaColumns: { col: number; code: string }[] = [];
    let headerRowIndex = -1;

    // Processar linha por linha
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex] as string[];
      if (!row || row.length === 0) continue;

      const firstCell = String(row[0] || '').trim().toUpperCase();

      // Detectar marcador de turno
      if (firstCell === 'MATUTINO') {
        currentTurno = 'Matutino';
        turmaColumns = [];
        headerRowIndex = -1;
        continue;
      }
      if (firstCell === 'VESPERTINO') {
        currentTurno = 'Vespertino';
        turmaColumns = [];
        headerRowIndex = -1;
        continue;
      }

      // Detectar linha de cabecalho (DIA, TEMPO, HORARIO, turmas...)
      if (firstCell === 'DIA' || firstCell === 'TEMPO') {
        headerRowIndex = rowIndex;
        turmaColumns = [];

        // Extrair colunas de turmas (a partir da coluna 3)
        for (let col = 3; col < row.length; col++) {
          const header = String(row[col] || '').trim();
          const turmaCode = extractTurmaCode(header);
          if (turmaCode && !turmaCode.match(/^(DIA|TEMPO|HORÁRIO|HORARIO)$/i)) {
            turmaColumns.push({ col, code: turmaCode });
          }
        }
        continue;
      }

      // Se ainda nao encontrou cabecalho, tentar detectar formato antigo
      if (headerRowIndex === -1 && turmaColumns.length === 0) {
        // Formato antigo: linha 2 tem cabecalhos
        if (rowIndex === 1) {
          for (let col = 3; col < row.length; col++) {
            const header = String(row[col] || '').trim();

            // Detectar mudanca para vespertino no formato antigo
            if (header === '' || header.includes('SEGUN')) {
              currentTurno = 'Vespertino';
              continue;
            }
            if (header.includes('VESP')) {
              currentTurno = 'Vespertino';
            }

            const turmaCode = extractTurmaCode(header);
            if (turmaCode) {
              turmaColumns.push({ col, code: turmaCode });
            }
          }
          headerRowIndex = 1;
          continue;
        }
      }

      // Pular se nao temos colunas de turmas definidas
      if (turmaColumns.length === 0) continue;

      // Verificar se e linha de dia
      if (DIA_MAP[firstCell]) {
        currentDia = DIA_MAP[firstCell];
      }

      // Verificar se tem tempo (1º, 2º, etc.)
      const col1 = String(row[1] || '').trim();
      const tempoMatch = col1.match(/(\d+)/);
      if (!tempoMatch) continue;

      const tempo = parseInt(tempoMatch[1]);

      // Parsear horario
      const col2 = String(row[2] || '').trim();
      const timeRange = parseTimeRange(col2);
      if (!timeRange) continue;

      // Se nao temos dia atual, detectar pelo horario
      if (!currentDia) {
        // Verificar se a primeira coluna tem um dia
        const possibleDay = String(row[0] || '').trim().toUpperCase();
        if (DIA_MAP[possibleDay]) {
          currentDia = DIA_MAP[possibleDay];
        } else {
          continue; // Pular linha sem dia definido
        }
      }

      // Detectar turno pelo horario se nao definido explicitamente
      const turnoByTime = detectTurno(timeRange.inicio);

      // Extrair disciplinas de cada turma
      for (const turmaCol of turmaColumns) {
        const disciplinaNome = String(row[turmaCol.col] || '').trim();

        if (isValidDisciplina(disciplinaNome)) {
          horarios.push({
            diaSemana: currentDia,
            tempo,
            horaInicio: timeRange.inicio,
            horaFim: timeRange.fim,
            turmaCode: turmaCol.code,
            turno: turnoByTime,
            disciplinaNome: disciplinaNome, // Manter original para preservar IDs (case-sensitive)
          });

          turmasSet.add(turmaCol.code);
          disciplinasSet.add(disciplinaNome); // Manter original
        }
      }
    }

    // Contar por turno
    const turnoMatutino = horarios.filter(h => h.turno === 'Matutino').length;
    const turnoVespertino = horarios.filter(h => h.turno === 'Vespertino').length;

    if (horarios.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum horario encontrado na planilha. Verifique se o formato esta correto.',
      } as ImportParseResponse);
    }

    return NextResponse.json({
      success: true,
      data: {
        horarios,
        turmasEncontradas: Array.from(turmasSet).sort(),
        disciplinasEncontradas: Array.from(disciplinasSet).sort(),
        turnoMatutino,
        turnoVespertino,
      },
    } as ImportParseResponse);

  } catch (error) {
    console.error('Erro ao processar planilha:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar planilha: ' + (error instanceof Error ? error.message : 'Erro desconhecido'),
    } as ImportParseResponse);
  }
}
