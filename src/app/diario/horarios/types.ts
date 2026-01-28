/**
 * Tipos locais do modulo de horarios.
 */

import { HorarioAula, DiaSemana, Turma, Disciplina, Usuario, HorarioSlot } from '@/types';

export interface HorarioCellProps {
  horario: HorarioAula | null;
  turma?: Turma;
  disciplina?: Disciplina;
  professor?: Usuario;
  professors?: Usuario[];  // Para disciplinas com múltiplos professores (ex: Trilhas)
  canEdit: boolean;
  canAddPessoal?: boolean;  // Professor pode adicionar horario pessoal
  onClick: () => void;
  onAddPessoal?: () => void;  // Callback para adicionar horario pessoal
}

export interface HorarioFormData {
  professorId: string;
  turmaId: string;
  disciplinaId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  sala: string;
}

export interface HorarioGridProps {
  horarios: HorarioAula[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  professores: Usuario[];
  timeSlots: HorarioSlot[];
  sextaVespertinoSlots?: HorarioSlot[];
  isVespertino?: boolean;
  canEdit: boolean;
  canAddPessoal?: boolean;  // Professor pode adicionar horarios pessoais
  onCellClick: (horario?: HorarioAula, slot?: { dia: DiaSemana; slot: HorarioSlot }) => void;
  onAddPessoal?: (slot: { dia: DiaSemana; slot: HorarioSlot }) => void;  // Callback para adicionar horario pessoal
  viewMode: 'turma' | 'professor';
}
