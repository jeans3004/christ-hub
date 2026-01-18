/**
 * Tipos para a aba de avaliacao.
 */

import { Aluno, Rubrica, AvaliacaoRubrica, NivelRubrica, Turma, Disciplina } from '@/types';

export interface AvaliacaoTabProps {
  // Filtros
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
  // Dados
  alunos: Aluno[];
  rubricas: Rubrica[];
  avaliacoes: AvaliacaoRubrica[];
  loading: boolean;
  // Acoes
  onSaveAvaliacao: (
    alunoId: string,
    rubricaId: string,
    disciplinaId: string,
    professorId: string,
    nivel: NivelRubrica
  ) => Promise<boolean>;
}
