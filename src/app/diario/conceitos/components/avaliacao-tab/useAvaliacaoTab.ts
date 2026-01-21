/**
 * Hook para logica da aba de avaliacao.
 */

import { useState, useCallback } from 'react';
import { AvaliacaoRubrica, NivelRubrica, Disciplina } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';

interface UseAvaliacaoTabProps {
  turmaId: string;
  disciplinaId: string;
  disciplinas: Disciplina[];
  avaliacoes: AvaliacaoRubrica[];
  onSaveAvaliacao: (
    alunoId: string,
    rubricaId: string,
    disciplinaId: string,
    professorId: string,
    nivel: NivelRubrica
  ) => Promise<boolean>;
}

export function useAvaliacaoTab({
  turmaId,
  disciplinaId,
  disciplinas,
  avaliacoes,
  onSaveAvaliacao,
}: UseAvaliacaoTabProps) {
  const { usuario } = useAuth();
  const { addToast } = useUIStore();
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, NivelRubrica>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});

  const disciplinasFiltradas = turmaId
    ? disciplinas.filter((d) => d.turmaIds?.includes(turmaId))
    : [];

  const getAvaliacao = useCallback((alunoId: string, rubricaId: string): NivelRubrica | null => {
    const key = `${alunoId}-${rubricaId}`;
    if (pendingChanges[key]) return pendingChanges[key];
    // Verifica também disciplinaId para evitar conflitos entre disciplinas
    const avaliacao = avaliacoes.find(
      (a) => a.alunoId === alunoId && a.rubricaId === rubricaId && a.disciplinaId === disciplinaId
    );
    return avaliacao?.nivel || null;
  }, [pendingChanges, avaliacoes, disciplinaId]);

  const handleNivelClick = useCallback((alunoId: string, rubricaId: string, nivel: NivelRubrica) => {
    const key = `${alunoId}-${rubricaId}`;
    const currentAvaliacao = avaliacoes.find(
      (a) => a.alunoId === alunoId && a.rubricaId === rubricaId && a.disciplinaId === disciplinaId
    );
    const current = pendingChanges[key] || currentAvaliacao?.nivel;

    if (current === nivel) {
      setPendingChanges((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    } else {
      setPendingChanges((prev) => ({ ...prev, [key]: nivel }));
    }
  }, [pendingChanges, avaliacoes, disciplinaId]);

  const handleSaveAll = useCallback(async () => {
    if (!usuario || !disciplinaId) {
      addToast('Selecione uma disciplina', 'error');
      return;
    }

    if (Object.keys(pendingChanges).length === 0) {
      addToast('Nenhuma alteração para salvar', 'info');
      return;
    }

    setSaving(true);
    try {
      const entries = Object.entries(pendingChanges);
      for (const [key, nivel] of entries) {
        const [alunoId, rubricaId] = key.split('-');
        await onSaveAvaliacao(alunoId, rubricaId, disciplinaId, usuario.id, nivel);
      }
      setPendingChanges({});
      addToast('Avaliações salvas com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving avaliacoes:', error);
      addToast('Erro ao salvar avaliações', 'error');
    } finally {
      setSaving(false);
    }
  }, [usuario, disciplinaId, pendingChanges, onSaveAvaliacao, addToast]);

  const handleObservacaoChange = useCallback((alunoId: string, texto: string) => {
    setObservacoes((prev) => {
      if (texto.trim() === '') {
        const updated = { ...prev };
        delete updated[alunoId];
        return updated;
      }
      return { ...prev, [alunoId]: texto };
    });
  }, []);

  const hasPendingChanges = Object.keys(pendingChanges).length > 0 || Object.keys(observacoes).length > 0;
  const pendingCount = Object.keys(pendingChanges).length + Object.keys(observacoes).length;

  return {
    saving,
    disciplinasFiltradas,
    pendingChanges,
    hasPendingChanges,
    pendingCount,
    observacoes,
    getAvaliacao,
    handleNivelClick,
    handleObservacaoChange,
    handleSaveAll,
  };
}
