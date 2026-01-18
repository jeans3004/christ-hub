/**
 * Tipos para os hooks de dossie.
 */

import { Turma, Aluno } from '@/types';
import { AlunoDossie, ModalState } from '../types';

export interface UseDossieDataReturn {
  // Dados basicos
  turmas: Turma[];
  alunos: Aluno[];
  loadingTurmas: boolean;
  loadingAlunos: boolean;

  // Filtros
  ano: number;
  turmaId: string;
  setAno: (ano: number) => void;
  setTurmaId: (turmaId: string) => void;

  // Modal de detalhes
  modalState: ModalState;
  dossieData: AlunoDossie | null;
  openModal: (alunoId: string) => void;
  closeModal: () => void;

  // Permissoes
  canEdit: boolean;
}
