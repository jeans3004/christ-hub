/**
 * Hook para carregar dados do preparatorio (reforco).
 * Agrega alunos de multiplas turmas via whitelist (alunosPorTurma).
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFilterStore } from '@/store/filterStore';
import { useTurmas, useDisciplinas } from '@/hooks/useFirestoreData';
import { alunoService } from '@/services/firestore';
import { Aluno, Disciplina } from '@/types';

export function usePreparatorioLoader() {
  const { ano } = useFilterStore();
  const { disciplinas: todasDisciplinas, loading: loadingDisciplinas } = useDisciplinas();
  const { turmas, loading: loadingTurmas } = useTurmas(ano);

  const [disciplinaId, setDisciplinaId] = useState('');
  const [dataChamada, setDataChamada] = useState(new Date().toISOString().split('T')[0]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);

  // Identificar disciplinas preparatorio: filhas de um grupo pai com isGroup e nome contendo "Preparatorio"
  const disciplinasPrep = useMemo(() => {
    const gruposPrep = todasDisciplinas.filter(
      d => d.isGroup && d.nome.toLowerCase().includes('preparat')
    );
    if (gruposPrep.length === 0) return [];

    const grupoIds = new Set(gruposPrep.map(g => g.id));
    return todasDisciplinas.filter(
      d => d.parentId && grupoIds.has(d.parentId) && !d.isGroup
    );
  }, [todasDisciplinas]);

  // Disciplina selecionada
  const disciplinaSelecionada = useMemo(
    () => disciplinasPrep.find(d => d.id === disciplinaId),
    [disciplinasPrep, disciplinaId]
  );

  // Agregar alunos de todas as turmas que tem whitelist para a disciplina selecionada
  const loadAlunos = useCallback(async () => {
    if (!disciplinaSelecionada || turmas.length === 0) {
      setAlunos([]);
      return;
    }

    setLoadingAlunos(true);
    try {
      const alunosPorTurma = disciplinaSelecionada.alunosPorTurma || {};
      const turmasComWhitelist = turmas.filter(t => {
        const whitelist = alunosPorTurma[t.id];
        return whitelist && whitelist.length > 0;
      });

      if (turmasComWhitelist.length === 0) {
        setAlunos([]);
        return;
      }

      // Carregar alunos de cada turma em paralelo
      const promises = turmasComWhitelist.map(async (turma) => {
        const alunosTurma = await alunoService.getByTurma(turma.id);
        const whitelistSet = new Set(alunosPorTurma[turma.id]);
        return alunosTurma.filter(a => whitelistSet.has(a.id));
      });

      const results = await Promise.all(promises);
      const todosAlunos = results.flat();

      // Deduplicar por ID e ordenar por nome
      const uniqueMap = new Map<string, Aluno>();
      todosAlunos.forEach(a => {
        if (!uniqueMap.has(a.id)) uniqueMap.set(a.id, a);
      });

      const sorted = Array.from(uniqueMap.values()).sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR')
      );

      setAlunos(sorted);
    } catch (error) {
      console.error('Erro ao carregar alunos do preparatorio:', error);
      setAlunos([]);
    } finally {
      setLoadingAlunos(false);
    }
  }, [disciplinaSelecionada, turmas]);

  useEffect(() => {
    loadAlunos();
  }, [loadAlunos]);

  const loading = loadingDisciplinas || loadingTurmas || loadingAlunos;

  return {
    disciplinaId,
    setDisciplinaId,
    dataChamada,
    setDataChamada,
    disciplinasPrep,
    alunos,
    loading,
    ano,
  };
}
