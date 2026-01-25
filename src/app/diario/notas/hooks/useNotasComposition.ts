/**
 * Hook para gerenciamento de composicao de notas.
 * Calcula notas automaticamente baseado nas avaliacoes de rubricas.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { notaService } from '@/services/firestore';
import { NotaComposicao, TipoAv } from '@/types';
import { parseCellKey, getCellKey } from '../types';
import { calcularValorComponente, gerarFormula, calcularNota, getTotalMax, getAvaliacaoAluno } from './compositionUtils';
import type { UseNotasCompositionParams, UseNotasCompositionReturn, FormulaDetalhada, ComposicaoStatus } from './compositionTypes';

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

  // Helper para mapear TipoAv para tipo de nota no banco
  const getNotaTipo = (av: TipoAv): 'AV1' | 'AV2' | 'REC' => {
    switch (av) {
      case 'av1': return 'AV1';
      case 'av2': return 'AV2';
      case 'rp1':
      case 'rp2': return 'REC';
    }
  };

  // Helper para obter chaves de nota e composicao
  const getNotaKeys = (av: TipoAv) => ({
    notaIdKey: `${av}Id` as 'av1Id' | 'av2Id' | 'rp1Id' | 'rp2Id',
    composicaoKey: `${av}Composicao` as 'av1Composicao' | 'av2Composicao' | 'rp1Composicao' | 'rp2Composicao',
  });

  // Recalcular notas de composicao automaticamente quando avaliacoes mudam
  const recalculateCompositions = useCallback(async () => {
    if (!serieId || !disciplinaId || !usuario || avaliacoes.length === 0) return;

    // Pegar todos os alunos do objeto notas
    const alunoIds = Object.keys(notas);
    if (alunoIds.length === 0) return;

    // Para cada aluno, calcular AV1, AV2, RP1, RP2
    for (const alunoId of alunoIds) {
      for (const av of ['av1', 'av2', 'rp1', 'rp2'] as const) {
        const template = getTemplate(av);

        // Verificar se template tem rubricas configuradas
        const hasRubricasConfigured = template.some(
          (comp) => comp.rubricaIds && comp.rubricaIds.length > 0
        );
        if (!hasRubricasConfigured) continue;

        // Calcular valores dos componentes
        const calculatedSubNotas = template.map((t) => {
          const { valor } = calcularValorComponente(t, alunoId, avaliacoes, rubricas, av);
          return { ...t, valor };
        });

        const notaCalculada = calcularNota(calculatedSubNotas);

        // Se conseguiu calcular, atualizar
        if (notaCalculada !== null) {
          const tipo = getNotaTipo(av);
          const { notaIdKey, composicaoKey } = getNotaKeys(av);
          const existingNotaId = notas[alunoId]?.[notaIdKey];
          const cellKey = getCellKey(alunoId, av);

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
    }
  }, [serieId, disciplinaId, usuario, avaliacoes, getTemplate, rubricas, notas, bimestre, ano, setModosCells, setNotas]);

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

  // Determinar status da composicao para exibicao na celula
  const getComposicaoStatus = useCallback((alunoId: string, av: TipoAv): ComposicaoStatus => {
    const template = getTemplate(av);

    // Verificar se template tem rubricas configuradas
    const hasRubricasConfigured = template.some(
      (comp) => comp.rubricaIds && comp.rubricaIds.length > 0
    );

    if (!hasRubricasConfigured) {
      return 'sem-template';
    }

    // Verificar se todas as rubricas estao avaliadas para este aluno
    for (const comp of template) {
      const rubricaIds = comp.rubricaIds || [];
      for (const rubricaId of rubricaIds) {
        const nivel = getAvaliacaoAluno(avaliacoes, alunoId, rubricaId, comp.id, av);
        if (nivel === null) {
          return 'falta-avaliar';
        }
      }
    }

    return 'pronto';
  }, [getTemplate, avaliacoes]);

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
    const tipo = getNotaTipo(av);
    const { notaIdKey, composicaoKey } = getNotaKeys(av);
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
    getComposicaoStatus,
  };
}
