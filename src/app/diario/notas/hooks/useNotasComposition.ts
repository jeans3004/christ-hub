/**
 * Hook para gerenciamento de composicao de notas.
 * Calcula notas automaticamente baseado nas avaliacoes de rubricas.
 */

import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { notaService } from '@/services/firestore';
import { NotaComposicao } from '@/types';
import { parseCellKey } from '../types';
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

  const openCompositionModal = useCallback((cellKey: string) => {
    const { alunoId, av } = parseCellKey(cellKey);
    setEditingCellKey(cellKey);

    const template = getTemplate(av);
    const novasSubNotas = template.map((t) => {
      const { valor } = calcularValorComponente(t, alunoId, avaliacoes, rubricas);
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
    const { alunoId } = parseCellKey(editingCellKey);
    return gerarFormula(subNotas, alunoId, avaliacoes, rubricas);
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
