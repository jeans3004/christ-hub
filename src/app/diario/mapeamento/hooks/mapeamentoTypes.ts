/**
 * Tipos para os hooks de mapeamento.
 */

import { Turma, Aluno, LayoutSala, Disciplina, MapeamentoSala } from '@/types';
import { CelulaMapa, AlunoMapa, ModoEdicao } from '../types';

export interface MapeamentoComProfessor extends MapeamentoSala {
  professorNome?: string;
  isConselheiro?: boolean;
}

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

  // Mapeamentos de outros professores (para visualização)
  mapeamentosDaTurma: MapeamentoComProfessor[];
  professorIdVisualizando: string | null;
  setProfessorIdVisualizando: (professorId: string | null) => void;
  conselheiroId: string | null;

  // Configuracao de layout da turma
  turmaSelecionada: Turma | null;
  layoutConfigurado: boolean;
  salvarLayoutPadrao: (layout: LayoutSala) => Promise<void>;
  toggleLayoutConfigurado: () => Promise<void>;

  // Acoes
  atualizarLayout: (layout: LayoutSala) => void;
  atualizarCelula: (row: number, col: number, updates: Partial<CelulaMapa>) => void;
  atribuirAluno: (row: number, col: number, alunoId: string | null) => void;
  alternarTipoCelula: (row: number, col: number) => void;
  distribuirAleatorio: () => void;
  limparTodos: () => void;
  salvar: () => Promise<void>;
  resetar: () => void;
  excluirMapeamento: () => Promise<void>;
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
