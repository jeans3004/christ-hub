/**
 * Hook para gerenciar configuracao de alunos por disciplina.
 * Permite selecionar quais alunos participam de disciplinas eletivas/especificas.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useFilterStore } from '@/store/filterStore';
import { useTurmas, useDisciplinas, useAlunosByTurma } from '@/hooks/useFirestoreData';
import { disciplinaService } from '@/services/firestore';

export function useAlunosDisciplinaConfig() {
  const { ano } = useFilterStore();
  const { addToast } = useUIStore();

  // Local state (independente dos filtros globais)
  const [turmaId, setTurmaId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [initialIds, setInitialIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Data hooks
  const { turmas, loading: loadingTurmas } = useTurmas(ano);
  const { disciplinas: todasDisciplinas, loading: loadingDisciplinas } = useDisciplinas();
  const { alunos, loading: loadingAlunos } = useAlunosByTurma(turmaId || null);

  // Disciplinas filtradas pela turma selecionada (apenas selecionaveis)
  const disciplinas = useMemo(() => {
    if (!turmaId) return [];
    return todasDisciplinas.filter(d => d.isGroup !== true && d.turmaIds?.includes(turmaId));
  }, [turmaId, todasDisciplinas]);

  // Carregar whitelist quando disciplina muda
  useEffect(() => {
    if (!disciplinaId || !turmaId) {
      setCheckedIds(new Set());
      setInitialIds(new Set());
      return;
    }

    const disciplina = todasDisciplinas.find(d => d.id === disciplinaId);
    const whitelist = disciplina?.alunosPorTurma?.[turmaId];

    if (whitelist?.length) {
      const ids = new Set(whitelist);
      setCheckedIds(ids);
      setInitialIds(new Set(ids));
    } else {
      setCheckedIds(new Set());
      setInitialIds(new Set());
    }
  }, [disciplinaId, turmaId, todasDisciplinas]);

  // Reset disciplina quando turma muda
  useEffect(() => {
    setDisciplinaId('');
  }, [turmaId]);

  const hasWhitelist = useMemo(() => {
    const disciplina = todasDisciplinas.find(d => d.id === disciplinaId);
    const whitelist = disciplina?.alunosPorTurma?.[turmaId];
    return !!whitelist?.length;
  }, [disciplinaId, turmaId, todasDisciplinas]);

  const hasChanges = useMemo(() => {
    if (checkedIds.size !== initialIds.size) return true;
    for (const id of checkedIds) {
      if (!initialIds.has(id)) return true;
    }
    return false;
  }, [checkedIds, initialIds]);

  const toggleAluno = useCallback((id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setCheckedIds(new Set(alunos.map(a => a.id)));
  }, [alunos]);

  const deselectAll = useCallback(() => {
    setCheckedIds(new Set());
  }, []);

  const save = useCallback(async () => {
    if (!disciplinaId || !turmaId) return;
    if (checkedIds.size === 0) {
      addToast('Selecione pelo menos um aluno', 'warning');
      return;
    }

    setSaving(true);
    try {
      await disciplinaService.updateAlunosPorTurma(disciplinaId, turmaId, Array.from(checkedIds));
      setInitialIds(new Set(checkedIds));
      addToast('Configuracao salva com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar configuracao:', error);
      addToast('Erro ao salvar configuracao', 'error');
    } finally {
      setSaving(false);
    }
  }, [disciplinaId, turmaId, checkedIds, addToast]);

  const clearWhitelist = useCallback(async () => {
    if (!disciplinaId || !turmaId) return;

    setSaving(true);
    try {
      await disciplinaService.clearAlunosPorTurma(disciplinaId, turmaId);
      setCheckedIds(new Set());
      setInitialIds(new Set());
      addToast('Configuracao removida. Todos os alunos serao exibidos.', 'success');
    } catch (error) {
      console.error('Erro ao limpar configuracao:', error);
      addToast('Erro ao limpar configuracao', 'error');
    } finally {
      setSaving(false);
    }
  }, [disciplinaId, turmaId, addToast]);

  return {
    // Selectors
    turmaId, setTurmaId,
    disciplinaId, setDisciplinaId,
    turmas, disciplinas, alunos,
    // Loading
    loadingTurmas, loadingDisciplinas, loadingAlunos,
    // Checkbox state
    checkedIds, toggleAluno, selectAll, deselectAll,
    // Flags
    hasChanges, hasWhitelist, saving,
    // Actions
    save, clearWhitelist,
  };
}
