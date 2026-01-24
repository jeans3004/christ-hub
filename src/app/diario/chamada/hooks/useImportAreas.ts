/**
 * Hook para importacao de areas do conhecimento via Google Sheets ou CSV.
 */

import { useState, useCallback } from 'react';
import { useDriveStore } from '@/store/driveStore';
import { useUIStore } from '@/store/uiStore';
import { sheetsService, SheetRow, SheetImportResult, ImportError, AlunoAtualizado } from '@/services/sheetsService';
import { alunoService } from '@/services/firestore/alunoService';
import { Aluno, ImportacaoAreaPreview, PreviewLinha, PreviewLinhaErro, ImportacaoStatus } from '@/types';
import { AREAS_CONHECIMENTO } from '@/constants';

interface UseImportAreasReturn {
  status: ImportacaoStatus;
  preview: ImportacaoAreaPreview | null;
  result: SheetImportResult | null;
  error: string | null;
  loadFromSpreadsheet: (spreadsheetUrl: string) => Promise<void>;
  loadFromCSV: (file: File) => Promise<void>;
  confirmImport: () => Promise<void>;
  reset: () => void;
}

export function useImportAreas(alunosExistentes: Aluno[]): UseImportAreasReturn {
  const [status, setStatus] = useState<ImportacaoStatus>('idle');
  const [preview, setPreview] = useState<ImportacaoAreaPreview | null>(null);
  const [result, setResult] = useState<SheetImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<SheetRow[]>([]);

  const { getAccessToken } = useDriveStore();
  const { addToast } = useUIStore();

  /**
   * Gera preview comparando dados da planilha com alunos existentes.
   */
  const generatePreview = useCallback((rows: SheetRow[]): ImportacaoAreaPreview => {
    const linhasValidas: PreviewLinha[] = [];
    const linhasInvalidas: PreviewLinhaErro[] = [];
    const resumoPorArea: Record<string, number> = {};
    const resumoPorSerie: Record<string, number> = {};

    // Criar mapa de alunos por nome (normalizado) e matricula
    const alunosPorNome = new Map<string, Aluno>();
    const alunosPorMatricula = new Map<string, Aluno>();

    alunosExistentes.forEach(aluno => {
      const nomeNormalizado = aluno.nome.toLowerCase().trim();
      alunosPorNome.set(nomeNormalizado, aluno);
      if (aluno.matricula) {
        alunosPorMatricula.set(aluno.matricula, aluno);
      }
    });

    rows.forEach((row, index) => {
      const erros: string[] = [];
      const linha = index + 2; // +2 pois linha 1 e header e index comeca em 0

      // Validar campos obrigatorios
      if (!row.identificador && !row.nome) {
        erros.push('Identificador/nome não encontrado');
      }
      if (!row.areaEscolhida) {
        erros.push('Área não informada');
      }

      // Normalizar area
      const areaId = sheetsService.normalizeArea(row.areaEscolhida);
      if (!areaId && row.areaEscolhida) {
        erros.push(`Área inválida: "${row.areaEscolhida}"`);
      }

      // Tentar encontrar aluno
      let alunoEncontrado: Aluno | undefined;

      // Primeiro por matricula
      if (row.identificador) {
        alunoEncontrado = alunosPorMatricula.get(row.identificador);
      }

      // Depois por nome
      if (!alunoEncontrado && row.nome) {
        const nomeNormalizado = row.nome.toLowerCase().trim();
        alunoEncontrado = alunosPorNome.get(nomeNormalizado);
      }

      // Tambem tentar match pelo identificador como nome
      if (!alunoEncontrado && row.identificador && !row.identificador.includes('@')) {
        const nomeNormalizado = row.identificador.toLowerCase().trim();
        alunoEncontrado = alunosPorNome.get(nomeNormalizado);
      }

      if (!alunoEncontrado) {
        erros.push('Aluno não encontrado no sistema');
      }

      if (erros.length > 0) {
        linhasInvalidas.push({
          linha,
          dados: [row.identificador, row.nome, row.serie, row.areaEscolhida],
          erros,
        });
      } else {
        const areaAtual = alunoEncontrado!.areaConhecimentoId;
        const areaNome = AREAS_CONHECIMENTO.find(a => a.id === areaAtual)?.nome;

        linhasValidas.push({
          linha,
          identificador: row.identificador || row.nome,
          nome: row.nome || alunoEncontrado!.nome,
          serie: row.serie,
          area: row.areaEscolhida,
          areaId,
          alunoExistente: {
            id: alunoEncontrado!.id,
            nome: alunoEncontrado!.nome,
            turma: alunoEncontrado!.turma || '',
            areaAtual: areaNome,
          },
        });

        // Contabilizar resumos
        if (areaId) {
          resumoPorArea[areaId] = (resumoPorArea[areaId] || 0) + 1;
        }
        if (row.serie) {
          const serieNorm = sheetsService.normalizeSerie(row.serie) || row.serie;
          resumoPorSerie[serieNorm] = (resumoPorSerie[serieNorm] || 0) + 1;
        }
      }
    });

    return { linhasValidas, linhasInvalidas, resumoPorArea, resumoPorSerie };
  }, [alunosExistentes]);

  /**
   * Carrega dados de uma planilha Google Sheets.
   */
  const loadFromSpreadsheet = useCallback(async (spreadsheetUrl: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError('Não conectado ao Google. Faça login novamente.');
      return;
    }

    if (!sheetsService.isValidSheetsUrl(spreadsheetUrl)) {
      setError('URL inválida. Use uma URL de planilha do Google Sheets.');
      return;
    }

    const spreadsheetId = sheetsService.extractSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) {
      setError('Não foi possível extrair o ID da planilha da URL.');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      // Buscar dados da planilha
      const rawData = await sheetsService.getSpreadsheetData(accessToken, spreadsheetId);

      if (rawData.length < 2) {
        throw new Error('Planilha vazia ou sem dados suficientes');
      }

      // Detectar colunas pelo header
      const headerMap = sheetsService.detectHeaderColumns(rawData[0]);

      // Verificar se encontrou as colunas necessarias
      if (headerMap.areaEscolhida === -1) {
        throw new Error('Coluna de área não encontrada. A planilha deve ter uma coluna com "área", "itinerário" ou "trilha".');
      }
      if (headerMap.identificador === -1 && headerMap.nome === -1) {
        throw new Error('Coluna de identificação não encontrada. A planilha deve ter uma coluna com "email", "matrícula" ou "nome".');
      }

      // Parsear linhas
      const rows = sheetsService.parseRows(rawData, headerMap);
      setParsedRows(rows);

      // Gerar preview
      const previewData = generatePreview(rows);
      setPreview(previewData);
      setStatus('preview');

      if (previewData.linhasValidas.length === 0) {
        addToast('Nenhum aluno válido encontrado para importação', 'warning');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar planilha');
      setStatus('error');
    }
  }, [getAccessToken, generatePreview, addToast]);

  /**
   * Carrega dados de um arquivo CSV.
   */
  const loadFromCSV = useCallback(async (file: File) => {
    setStatus('loading');
    setError(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => {
        // Parse CSV considerando campos entre aspas
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if ((char === ',' || char === ';') && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      }).filter(line => line.length > 1 || line[0]?.trim());

      if (lines.length < 2) {
        throw new Error('Arquivo CSV vazio ou sem dados suficientes');
      }

      // Detectar colunas pelo header
      const headerMap = sheetsService.detectHeaderColumns(lines[0]);

      if (headerMap.areaEscolhida === -1) {
        throw new Error('Coluna de área não encontrada no CSV');
      }
      if (headerMap.identificador === -1 && headerMap.nome === -1) {
        throw new Error('Coluna de identificação (nome/matrícula) não encontrada no CSV');
      }

      // Parsear linhas
      const rows = sheetsService.parseRows(lines, headerMap);
      setParsedRows(rows);

      // Gerar preview
      const previewData = generatePreview(rows);
      setPreview(previewData);
      setStatus('preview');

      if (previewData.linhasValidas.length === 0) {
        addToast('Nenhum aluno válido encontrado para importação', 'warning');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo CSV');
      setStatus('error');
    }
  }, [generatePreview, addToast]);

  /**
   * Confirma e executa a importacao.
   */
  const confirmImport = useCallback(async () => {
    if (!preview) return;

    setStatus('importing');
    const importResult: SheetImportResult = {
      total: preview.linhasValidas.length,
      processados: 0,
      erros: [],
      atualizados: [],
    };

    try {
      // Preparar batch de updates
      const updates: Array<{ alunoId: string; areaConhecimentoId: string }> = [];

      for (const linha of preview.linhasValidas) {
        if (!linha.alunoExistente || !linha.areaId) {
          importResult.erros.push({
            linha: linha.linha,
            identificador: linha.identificador,
            motivo: 'Dados incompletos',
          });
          continue;
        }

        updates.push({
          alunoId: linha.alunoExistente.id,
          areaConhecimentoId: linha.areaId,
        });

        importResult.atualizados.push({
          alunoId: linha.alunoExistente.id,
          nome: linha.alunoExistente.nome,
          areaAnterior: linha.alunoExistente.areaAtual,
          areaNova: linha.areaId,
        });
      }

      // Executar batch update
      if (updates.length > 0) {
        // Dividir em batches de 500 (limite do Firestore)
        const batchSize = 500;
        for (let i = 0; i < updates.length; i += batchSize) {
          const batch = updates.slice(i, i + batchSize);
          await alunoService.updateAreasConhecimentoBatch(batch);
        }
        importResult.processados = updates.length;
      }

      setResult(importResult);
      setStatus('success');
      addToast(`${importResult.processados} aluno(s) atualizado(s) com sucesso!`, 'success');
    } catch (err) {
      setError('Erro durante importação');
      setStatus('error');
      addToast('Erro ao importar áreas', 'error');
    }
  }, [preview, addToast]);

  /**
   * Reseta o estado do hook.
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setPreview(null);
    setResult(null);
    setError(null);
    setParsedRows([]);
  }, []);

  return {
    status,
    preview,
    result,
    error,
    loadFromSpreadsheet,
    loadFromCSV,
    confirmImport,
    reset,
  };
}
