/**
 * Hook para gerenciamento de avaliacoes por rubricas.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { avaliacaoRubricaService } from '@/services/firestore';
import { NotaComposicao, NivelRubrica, Rubrica, Disciplina } from '@/types';
import { RubricasSelecionadas, AvaliacaoInterna } from './types';
import { loadAvaliacoes, loadTemplate, saveRubricaSelection } from './avaliacaoUtils';

interface UseAvaliacaoRubricasParams {
  turmaId: string;
  disciplinaId: string;
  bimestre: number;
  ano: number;
  disciplinas: Disciplina[];
  rubricas: Rubrica[];
  onSaveSuccess?: () => void;
}

export function useAvaliacaoRubricas({
  turmaId, disciplinaId, bimestre, ano, disciplinas, rubricas, onSaveSuccess,
}: UseAvaliacaoRubricasParams) {
  const { usuario } = useAuth();
  const { addToast } = useUIStore();

  const [saving, setSaving] = useState(false);
  const [av, setAv] = useState<'av1' | 'av2'>('av1');
  const [template, setTemplate] = useState<NotaComposicao[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [rubricasSelecionadas, setRubricasSelecionadas] = useState<RubricasSelecionadas>({});
  const [expandedComponent, setExpandedComponent] = useState<string | false>(false);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoInterna[]>([]);
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, NivelRubrica>>({});

  const disciplinasFiltradas = turmaId ? disciplinas.filter((d) => d.turmaIds?.includes(turmaId)) : [];

  useEffect(() => {
    setLoadingAvaliacoes(true);
    loadAvaliacoes(turmaId, bimestre, ano, av)
      .then(setAvaliacoes)
      .finally(() => setLoadingAvaliacoes(false));
  }, [turmaId, bimestre, ano, av]);

  useEffect(() => {
    setLoadingTemplate(true);
    loadTemplate(turmaId, disciplinaId, bimestre, av, ano)
      .then(({ template: t, rubricas: r, firstId }) => {
        setTemplate(t);
        setRubricasSelecionadas(r);
        setExpandedComponent(firstId);
      })
      .finally(() => setLoadingTemplate(false));
  }, [turmaId, disciplinaId, bimestre, av, ano]);

  const handleRubricaToggle = useCallback((componenteId: string, rubricaId: string, maxRubricas: number) => {
    setRubricasSelecionadas((prev) => {
      const current = prev[componenteId] || [];
      const isSelected = current.includes(rubricaId);

      if (!isSelected && current.length >= maxRubricas) {
        addToast(`Maximo de ${maxRubricas} rubrica(s) para este componente`, 'warning');
        return prev;
      }

      const newIds = isSelected ? current.filter((id) => id !== rubricaId) : [...current, rubricaId];

      setTemplate((prevTemplate) => {
        const updated = prevTemplate.map((c) => (c.id === componenteId ? { ...c, rubricaIds: newIds } : c));
        saveRubricaSelection(turmaId, disciplinaId, bimestre, av, ano, updated).catch((err) => {
          console.error('Error saving rubricaIds:', err);
          addToast('Erro ao salvar selecao de rubricas', 'error');
        });
        return updated;
      });

      return { ...prev, [componenteId]: newIds };
    });
  }, [turmaId, disciplinaId, bimestre, av, ano, addToast]);

  const getAvaliacao = useCallback((alunoId: string, rubricaId: string, componenteId: string): NivelRubrica | null => {
    const key = `${alunoId}-${rubricaId}-${componenteId}`;
    if (pendingChanges[key]) return pendingChanges[key];
    return avaliacoes.find((a) => a.alunoId === alunoId && a.rubricaId === rubricaId && a.componenteId === componenteId)?.nivel || null;
  }, [avaliacoes, pendingChanges]);

  const handleNivelClick = useCallback((alunoId: string, rubricaId: string, componenteId: string, nivel: NivelRubrica) => {
    const key = `${alunoId}-${rubricaId}-${componenteId}`;
    const current = getAvaliacao(alunoId, rubricaId, componenteId);

    if (current === nivel) {
      setPendingChanges((prev) => { const u = { ...prev }; delete u[key]; return u; });
    } else {
      setPendingChanges((prev) => ({ ...prev, [key]: nivel }));
    }
  }, [getAvaliacao]);

  const handleSaveAll = useCallback(async () => {
    if (!usuario || !disciplinaId || !turmaId) { addToast('Selecione uma disciplina', 'error'); return; }
    if (Object.keys(pendingChanges).length === 0) { addToast('Nenhuma alteracao para salvar', 'info'); return; }

    setSaving(true);
    try {
      for (const [key, nivel] of Object.entries(pendingChanges)) {
        const [alunoId, rubricaId, componenteId] = key.split('-');
        const existing = avaliacoes.find((a) => a.alunoId === alunoId && a.rubricaId === rubricaId && a.componenteId === componenteId);

        if (existing) {
          await avaliacaoRubricaService.update(existing.id, { nivel });
        } else {
          await avaliacaoRubricaService.create({
            alunoId, turmaId, disciplinaId, rubricaId, componenteId,
            av, professorId: usuario.id, bimestre, ano, nivel,
          });
        }
      }

      const data = await loadAvaliacoes(turmaId, bimestre, ano, av);
      setAvaliacoes(data);
      setPendingChanges({});
      addToast('Avaliacoes salvas com sucesso!', 'success');
      onSaveSuccess?.();
    } catch (error) {
      console.error('Error saving avaliacoes:', error);
      addToast('Erro ao salvar avaliacoes', 'error');
    } finally {
      setSaving(false);
    }
  }, [usuario, disciplinaId, turmaId, pendingChanges, avaliacoes, av, bimestre, ano, addToast, onSaveSuccess]);

  const getRubricasDoComponente = useCallback((componenteId: string) => {
    const ids = rubricasSelecionadas[componenteId] || [];
    return rubricas.filter((r) => ids.includes(r.id));
  }, [rubricasSelecionadas, rubricas]);

  return {
    av, setAv, template, loadingTemplate, rubricasSelecionadas,
    expandedComponent, setExpandedComponent, loadingAvaliacoes, pendingChanges, saving,
    disciplinasFiltradas, hasPendingChanges: Object.keys(pendingChanges).length > 0,
    handleRubricaToggle, getAvaliacao, handleNivelClick, handleSaveAll, getRubricasDoComponente,
  };
}
