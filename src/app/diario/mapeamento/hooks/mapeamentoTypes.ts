/**
 * Tipos para os hooks de mapeamento.
 */

import { Turma, Aluno, LayoutSala, Disciplina } from '@/types';
import { CelulaMapa, AlunoMapa, ModoEdicao } from '../types';

export interface UseMapeamentoDataReturn {
  // Dados basicos
  turmas: Turma[];
  disciplinas: Disciplina[];
  alunos: Aluno[];
  alunosDisponiveis: AlunoMapa[];
  loadingTurmas: boolean;
  loadingDisciplinas: boolean;
  loadingAlunos: boolean;
  loadingMapeamento: boolean;
  saving: boolean;

  // Filtros
  ano: number;
  turmaId: string;
  disciplinaId: string;
  setAno: (ano: number) => void;
  setTurmaId: (turmaId: string) => void;
  setDisciplinaId: (disciplinaId: string) => void;

  // Layout e celulas
  layout: LayoutSala;
  celulas: CelulaMapa[];
  isDirty: boolean;

  // Modo de edicao
  modoEdicao: ModoEdicao;
  setModoEdicao: (modo: ModoEdicao) => void;

  // Acoes
  atualizarLayout: (layout: LayoutSala) => void;
  atualizarCelula: (row: number, col: number, updates: Partial<CelulaMapa>) => void;
  atribuirAluno: (row: number, col: number, alunoId: string | null) => void;
  alternarTipoCelula: (row: number, col: number) => void;
  salvar: () => Promise<void>;
  resetar: () => void;
}

export interface MapeamentoState {
  turmas: Turma[];
  alunos: Aluno[];
  loadingTurmas: boolean;
  loadingAlunos: boolean;
  loadingMapeamento: boolean;
  layout: LayoutSala;
  celulas: CelulaMapa[];
  isDirty: boolean;
}
