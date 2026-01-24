/**
 * Hook para gerenciamento de composicao de notas.
 * Calcula notas automaticamente baseado nas avaliacoes de rubricas.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { notaService } from '@/services/firestore';
import { NotaComposicao } from '@/types';
import { parseCellKey, getCellKey } from '../types';
import { calcularValorComponente, gerarFormula, calcularNota, getTotalMax } from './compositionUtils';
import type { UseNotasCompositionParams, UseNotasCompositionReturn, FormulaDetalhada } from './compositionTypes';

export function useNotasComposition({
  serieId,
  disciplinaId,
  bimestre,
  ano,
  notas,
  setNotas,
  modosCells,
  setModosCells,
  getTemplate,
  avaliacoes,
  rubricas,
}: UseNotasCompositionParams): UseNotasCompositionReturn {
  const { addToast } = useUIStore();
  const { usuario } = useAuth();

  const [notasModalOpen, setNotasModalOpen] = useState(false);
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [subNotas, setSubNotas] = useState<NotaComposicao[]>([]);
  const [savingComposicao, setSavingComposicao] = useState(false);
  const prevAvaliacoesRef = useRef(avaliacoes);

  // Recalcular notas de composicao automaticamente quando avaliacoes mudam
  const recalculateCompositions = useCallback(async () => {
    if (!serieId || !disciplinaId || !usuario || avaliacoes.length === 0) return;

    // Pegar todos os alunos que tem modo composicao
    const cellsComposicao = Object.entries(modosCells).filter(
      ([, cell]) => cell.modo === 'composicao'
    );

    if (cellsComposicao.length === 0) return;

    for (const [cellKey] of cellsComposicao) {
      const { alunoId, av } = parseCellKey(cellKey);
      const template = getTemplate(av);

      // Calcular valores dos componentes
      const calculatedSubNotas = template.map((t) => {
        const { valor } = calcularValorComponente(t, alunoId, avaliacoes, rubricas, av);
        return { ...t, valor };
      });

      const notaCalculada = calcularNota(calculatedSubNotas);

      // Se conseguiu calcular, atualizar
      if (notaCalculada !== null) {
        const tipo = av === 'av1' ? 'AV1' : 'AV2';
        const notaIdKey = av === 'av1' ? 'av1Id' : 'av2Id';
        const composicaoKey = av === 'av1' ? 'av1Composicao' : 'av2Composicao';
        const existingNotaId = notas[alunoId]?.[notaIdKey];

        try {
          const notaData: Record<string, unknown> = {
            alunoId,
            turmaId: serieId,
            disciplinaId,
            professorId: usuario.id,
            bimestre: bimestre as 1 | 2 | 3 | 4,
            tipo,
            valor: notaCalculada,
            ano,
            composicao: calculatedSubNotas,
          };

          let notaId = existingNotaId;
          if (existingNotaId) {
            await notaService.update(existingNotaId, notaData);
          } else {
            notaId = await notaService.create(notaData as Parameters<typeof notaService.create>[0]);
          }

          // Atualizar estado local
          setModosCells((prev) => ({
            ...prev,
            [cellKey]: { modo: 'composicao', composicao: calculatedSubNotas },
          }));

          setNotas((prev) => ({
            ...prev,
            [alunoId]: {
              ...prev[alunoId],
              [av]: notaCalculada,
              [notaIdKey]: notaId,
              [composicaoKey]: calculatedSubNotas,
            },
          }));
        } catch (error) {
          console.error('Erro ao atualizar nota composicao:', error);
        }
      }
    }
  }, [serieId, disciplinaId, usuario, avaliacoes, modosCells, getTemplate, rubricas, notas, bimestre, ano, setModosCells, setNotas]);

  // Detectar mudancas em avaliacoes e recalcular
  useEffect(() => {
    if (prevAvaliacoesRef.current !== avaliacoes && avaliacoes.length > 0) {
      prevAvaliacoesRef.current = avaliacoes;
      recalculateCompositions();
    }
  }, [avaliacoes, recalculateCompositions]);

  const openCompositionModal = useCallback((cellKey: string) => {
    const { alunoId, av } = parseCellKey(cellKey);
    setEditingCellKey(cellKey);

    const template = getTemplate(av);
    const novasSubNotas = template.map((t) => {
      const { valor } = calcularValorComponente(t, alunoId, avaliacoes, rubricas, av);
      return { ...t, valor };
    });

    setSubNotas(novasSubNotas);
    setNotasModalOpen(true);
  }, [getTemplate, avaliacoes, rubricas]);

  const closeCompositionModal = useCallback(() => {
    setNotasModalOpen(false);
    setEditingCellKey(null);
  }, []);

  const handleSubNotaValorChange = useCallback((id: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value.replace(',', '.'));

    setSubNotas((prev) => {
      const componente = prev.find((s) => s.id === id);
      const notaMaxima = componente?.porcentagem || 10;

      if (numValue !== null && numValue < 0) {
        addToast('A nota nao pode ser negativa', 'warning');
        return prev;
      }

      if (numValue !== null && numValue > notaMaxima) {
        addToast(`${componente?.nome}: nota maxima e ${notaMaxima}`, 'warning');
        return prev;
      }

      return prev.map((s) => (s.id === id ? { ...s, valor: numValue } : s));
    });
  }, [addToast]);

  const getTotalValoresMax = useCallback((): number => getTotalMax(subNotas), [subNotas]);

  const calcularNotaComposicao = useCallback((): number | null => calcularNota(subNotas), [subNotas]);

  const gerarFormulaDetalhada = useCallback((): FormulaDetalhada | null => {
    if (subNotas.length === 0 || !editingCellKey) return null;
    const { alunoId, av } = parseCellKey(editingCellKey);
    return gerarFormula(subNotas, alunoId, avaliacoes, rubricas, av);
  }, [subNotas, editingCellKey, avaliacoes, rubricas]);

  const handleSaveNotasComposicao = useCallback(async () => {
    if (subNotas.length === 0) {
      addToast('Adicione componentes na composicao primeiro', 'error');
      return;
    }

    const notaCalculada = calcularNota(subNotas);
    if (notaCalculada === null) {
      addToast('Preencha todas as notas dos componentes', 'error');
      return;
    }

    if (!editingCellKey || !serieId || !disciplinaId || !usuario) {
      addToast('Erro: dados incompletos', 'error');
      return;
    }

    const { alunoId, av } = parseCellKey(editingCellKey);
    const tipo = av === 'av1' ? 'AV1' : 'AV2';
    const notaIdKey = av === 'av1' ? 'av1Id' : 'av2Id';
    const composicaoKey = av === 'av1' ? 'av1Composicao' : 'av2Composicao';
    const existingNotaId = notas[alunoId]?.[notaIdKey];

    setSavingComposicao(true);
    try {
      const notaData: Record<string, unknown> = {
        alunoId,
        turmaId: serieId,
        disciplinaId,
        professorId: usuario.id,
        bimestre: bimestre as 1 | 2 | 3 | 4,
        tipo,
        valor: notaCalculada,
        ano,
        composicao: subNotas,
      };

      let notaId = existingNotaId;
      if (existingNotaId) {
        await notaService.update(existingNotaId, notaData);
      } else {
        notaId = await notaService.create(notaData as Parameters<typeof notaService.create>[0]);
      }

      setModosCells((prev) => ({
        ...prev,
        [editingCellKey]: { modo: 'composicao', composicao: subNotas },
      }));

      setNotas((prev) => ({
        ...prev,
        [alunoId]: {
          ...prev[alunoId],
          [av]: notaCalculada,
          [notaIdKey]: notaId,
          [composicaoKey]: subNotas,
        },
      }));

      addToast(`Nota ${notaCalculada} salva com sucesso!`, 'success');
      closeCompositionModal();
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      addToast('Erro ao salvar nota no banco de dados', 'error');
    } finally {
      setSavingComposicao(false);
    }
  }, [subNotas, editingCellKey, serieId, disciplinaId, usuario, bimestre, ano, notas, setNotas, setModosCells, addToast, closeCompositionModal]);

  return {
    notasModalOpen,
    editingCellKey,
    subNotas,
    savingComposicao,
    openCompositionModal,
    closeCompositionModal,
    handleSubNotaValorChange,
    getTotalValoresMax,
    calcularNotaComposicao,
    gerarFormulaDetalhada,
    handleSaveNotasComposicao,
  };
}
