'use client';

/**
 * Hook para gerenciar o modal de dossie.
 */

import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { chamadaService, avaliacaoRubricaService, ocorrenciaService } from '@/services/firestore';
import { Aluno, Turma, Rubrica, Disciplina } from '@/types';
import { AlunoDossie, ModalState } from '../types';
import { calcularFrequencia, enriquecerAvaliacoes } from './dossieUtils';

interface UseDossieModalReturn {
  modalState: ModalState;
  dossieData: AlunoDossie | null;
  openModal: (alunoId: string, tabIndex?: number) => void;
  closeModal: () => void;
}

interface UseDossieModalProps {
  alunos: Aluno[];
  turmas: Turma[];
  rubricas: Rubrica[];
  disciplinas: Disciplina[];
  ano: number;
}

export function useDossieModal({ alunos, turmas, rubricas, disciplinas, ano }: UseDossieModalProps): UseDossieModalReturn {
  const { addToast } = useUIStore();

  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    alunoId: null,
    loading: false,
    initialTab: 0,
  });
  const [dossieData, setDossieData] = useState<AlunoDossie | null>(null);

  const loadDossieCompleto = useCallback(async (alunoId: string): Promise<AlunoDossie | null> => {
    const aluno = alunos.find((a) => a.id === alunoId);
    if (!aluno) return null;

    const turma = turmas.find((t) => t.id === aluno.turmaId);

    try {
      const [chamadas, avaliacoes, ocorrencias] = await Promise.all([
        chamadaService.getByTurmaAno(aluno.turmaId, ano),
        avaliacaoRubricaService.getByAluno(alunoId, ano),
        ocorrenciaService.getByAluno(alunoId),
      ]);

      const frequencia = calcularFrequencia(alunoId, chamadas);
      const avaliacoesComDetalhes = enriquecerAvaliacoes(avaliacoes, rubricas, disciplinas);

      return {
        ...aluno,
        turmaNome: turma?.nome || 'Turma desconhecida',
        frequencia,
        avaliacoes: avaliacoesComDetalhes,
        ocorrencias: ocorrencias.filter((o) => o.status !== 'cancelada'),
      };
    } catch (error) {
      console.error('Erro ao carregar dossie:', error);
      throw error;
    }
  }, [alunos, turmas, rubricas, disciplinas, ano]);

  const openModal = useCallback(async (alunoId: string, tabIndex: number = 0) => {
    setModalState({ open: true, alunoId, loading: true, initialTab: tabIndex });
    setDossieData(null);

    try {
      const dossie = await loadDossieCompleto(alunoId);
      setDossieData(dossie);
    } catch (error) {
      addToast('Erro ao carregar detalhes do aluno', 'error');
    } finally {
      setModalState((prev) => ({ ...prev, loading: false }));
    }
  }, [loadDossieCompleto, addToast]);

  const closeModal = useCallback(() => {
    setModalState({ open: false, alunoId: null, loading: false, initialTab: 0 });
    setDossieData(null);
  }, []);

  return { modalState, dossieData, openModal, closeModal };
}
