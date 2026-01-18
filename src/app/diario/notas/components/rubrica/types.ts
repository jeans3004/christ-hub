/**
 * Tipos para avaliacao por rubricas.
 */

import { Aluno, Rubrica, NivelRubrica, Turma, Disciplina, NotaComposicao } from '@/types';

/**
 * Rubricas selecionadas por componente.
 * componenteId -> rubricaIds[]
 */
export type RubricasSelecionadas = Record<string, string[]>;

/**
 * Avaliacao interna para gerenciamento de estado.
 */
export interface AvaliacaoInterna {
  id: string;
  alunoId: string;
  rubricaId: string;
  componenteId: string;
  nivel: NivelRubrica;
}

/**
 * Props do componente AvaliacaoRubricasTab.
 */
export interface AvaliacaoRubricasTabProps {
  ano: number;
  turmaId: string;
  disciplinaId: string;
  bimestre: number;
  turmas: Turma[];
  disciplinas: Disciplina[];
  loadingTurmas: boolean;
  loadingDisciplinas: boolean;
  onAnoChange: (ano: number) => void;
  onTurmaChange: (turmaId: string) => void;
  onDisciplinaChange: (disciplinaId: string) => void;
  onBimestreChange: (bimestre: number) => void;
  alunos: Aluno[];
  rubricas: Rubrica[];
  loadingAlunos: boolean;
}

/**
 * Props do componente AvaliacaoFilters.
 */
export interface AvaliacaoFiltersProps {
  ano: number;
  turmaId: string;
  disciplinaId: string;
  bimestre: number;
  av: 'av1' | 'av2';
  turmas: Turma[];
  disciplinas: Disciplina[];
  disciplinasFiltradas: Disciplina[];
  loadingTurmas: boolean;
  loadingDisciplinas: boolean;
  onAnoChange: (ano: number) => void;
  onTurmaChange: (turmaId: string) => void;
  onDisciplinaChange: (disciplinaId: string) => void;
  onBimestreChange: (bimestre: number) => void;
  onAvChange: (av: 'av1' | 'av2') => void;
}

/**
 * Props do componente RubricaSelector.
 */
export interface RubricaSelectorProps {
  componenteId: string;
  qtdNecessarias: number;
  rubricas: Rubrica[];
  rubricasSelecionadas: string[];
  onToggle: (componenteId: string, rubricaId: string, maxRubricas: number) => void;
}

/**
 * Props do componente AvaliacaoGrid.
 */
export interface AvaliacaoGridProps {
  alunos: Aluno[];
  rubricasComponente: Rubrica[];
  componenteId: string;
  getAvaliacao: (alunoId: string, rubricaId: string, componenteId: string) => NivelRubrica | null;
  onNivelClick: (alunoId: string, rubricaId: string, componenteId: string, nivel: NivelRubrica) => void;
}

/**
 * Props do componente NivelButton.
 */
export interface NivelButtonProps {
  nivel: NivelRubrica;
  isSelected: boolean;
  description?: string;
  onClick: () => void;
}
