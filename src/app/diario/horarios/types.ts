/**
 * Tipos locais do modulo de horarios.
 */

import { HorarioAula, DiaSemana, Turma, Disciplina, Usuario, HorarioSlot } from '@/types';

export interface HorarioCellProps {
  horario: HorarioAula | null;
  turma?: Turma;
  disciplina?: Disciplina;
  professor?: Usuario;
  canEdit: boolean;
  onClick: () => void;
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
  onCellClick: (horario?: HorarioAula, slot?: { dia: DiaSemana; slot: HorarioSlot }) => void;
  viewMode: 'turma' | 'professor';
}
