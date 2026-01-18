/**
 * Hook principal para dados da pagina de Dossie do Aluno.
 */

import { useState } from 'react';
import { useFilterStore } from '@/store/filterStore';
import { UseDossieDataReturn } from './dossieTypes';
import { useDossieLoader } from './useDossieLoader';
import { useDossieModal } from './useDossieModal';

export function useDossieData(): UseDossieDataReturn {
  const { ano, setAno } = useFilterStore();
  const [turmaId, setTurmaId] = useState('');

  const { turmas, alunos, rubricas, disciplinas, loadingTurmas, loadingAlunos, canEdit } = useDossieLoader(ano, turmaId);

  const { modalState, dossieData, openModal, closeModal } = useDossieModal({
    alunos,
    turmas,
    rubricas,
    disciplinas,
    ano,
  });

  return {
    turmas,
    alunos,
    loadingTurmas,
    loadingAlunos,
    ano,
    turmaId,
    setAno,
    setTurmaId,
    modalState,
    dossieData,
    openModal,
    closeModal,
    canEdit,
  };
}
