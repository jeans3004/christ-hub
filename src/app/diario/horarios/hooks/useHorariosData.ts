'use client';

/**
 * Hook composto para gerenciamento de horarios.
 * Combina loader + actions + estado local.
 */

import { useState, useMemo, useCallback } from 'react';
import { useFilterStore } from '@/store/filterStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useHorariosLoader } from './useHorariosLoader';
import { useHorariosActions } from './useHorariosActions';
import { HorarioAula, DiaSemana, HorarioSlot } from '@/types';

// Time slots padrao - 7 tempos de 45 minutos cada
export const DEFAULT_TIME_SLOTS: HorarioSlot[] = [
  // Matutino (7:00 - 12:15)
  { horaInicio: '07:00', horaFim: '07:45', label: '1o Tempo' },
  { horaInicio: '07:45', horaFim: '08:30', label: '2o Tempo' },
  { horaInicio: '08:30', horaFim: '09:15', label: '3o Tempo' },
  { horaInicio: '09:15', horaFim: '10:00', label: '4o Tempo' },
  { horaInicio: '10:00', horaFim: '10:45', label: '5o Tempo' },
  { horaInicio: '10:45', horaFim: '11:30', label: '6o Tempo' },
  { horaInicio: '11:30', horaFim: '12:15', label: '7o Tempo' },
  // Vespertino (13:00 - 18:15)
  { horaInicio: '13:00', horaFim: '13:45', label: '1o Tempo' },
  { horaInicio: '13:45', horaFim: '14:30', label: '2o Tempo' },
  { horaInicio: '14:30', horaFim: '15:15', label: '3o Tempo' },
  { horaInicio: '15:15', horaFim: '16:00', label: '4o Tempo' },
  { horaInicio: '16:00', horaFim: '16:45', label: '5o Tempo' },
  { horaInicio: '16:45', horaFim: '17:30', label: '6o Tempo' },
  { horaInicio: '17:30', horaFim: '18:15', label: '7o Tempo' },
];

// Sexta-feira Vespertino - 7 tempos de 35 minutos cada (13:00 - 17:05)
export const SEXTA_VESPERTINO_SLOTS: HorarioSlot[] = [
  { horaInicio: '13:00', horaFim: '13:35', label: '1o Tempo' },
  { horaInicio: '13:35', horaFim: '14:10', label: '2o Tempo' },
  { horaInicio: '14:10', horaFim: '14:45', label: '3o Tempo' },
  { horaInicio: '14:45', horaFim: '15:20', label: '4o Tempo' },
  { horaInicio: '15:20', horaFim: '15:55', label: '5o Tempo' },
  { horaInicio: '15:55', horaFim: '16:30', label: '6o Tempo' },
  { horaInicio: '16:30', horaFim: '17:05', label: '7o Tempo' },
];

export type ViewMode = 'turma' | 'professor';
export type GridViewType = 'individual' | 'grade';

export function useHorariosData() {
  const { ano, setAno } = useFilterStore();
  const { isCoordinatorOrAbove, isProfessor, usuario } = usePermissions();

  // Determinar se usuario e professor (para definir padroes)
  const userIsProfessor = isProfessor() && !isCoordinatorOrAbove();

  // Estado local para filtros da pagina
  // Professor ve por padrao a visualizacao individual/professor, outros veem grade/turma
  const [gridViewType, setGridViewType] = useState<GridViewType>(() => userIsProfessor ? 'individual' : 'grade');
  const [turmaId, setTurmaId] = useState('');
  const [professorId, setProfessorId] = useState(() => userIsProfessor && usuario?.id ? usuario.id : '');
  const [viewMode, setViewMode] = useState<ViewMode>(() => userIsProfessor ? 'professor' : 'turma');
  const [editingHorario, setEditingHorario] = useState<HorarioAula | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ dia: DiaSemana; slot: HorarioSlot } | null>(null);

  // Carregar dados
  // Na visualizacao de grade, sempre carregar todos os horarios (sem filtro)
  // Na visualizacao individual, filtrar por turma ou professor (exceto "todos")
  const {
    horarios,
    turmas,
    disciplinas,
    professores,
    loading,
    error,
    refetch,
  } = useHorariosLoader({
    ano,
    turmaId: gridViewType === 'individual' && viewMode === 'turma' ? turmaId : undefined,
    professorId: gridViewType === 'individual' && viewMode === 'professor' && professorId !== 'todos' ? professorId : undefined,
  });

  // Acoes
  const actions = useHorariosActions(refetch);

  // Permissoes de edicao
  const canEdit = isCoordinatorOrAbove();

  // Verificar se e vespertino (para ajustar slots de sexta-feira)
  const isVespertino = useMemo(() => {
    if (viewMode === 'turma' && turmaId) {
      const turma = turmas.find(t => t.id === turmaId);
      return turma?.turno === 'Vespertino';
    }
    // Na visualização por professor, verificar se há horários vespertinos
    if (viewMode === 'professor' && horarios.length > 0) {
      // Considerar vespertino se houver algum horário após 12:00
      return horarios.some(h => {
        const hora = parseInt(h.horaInicio.split(':')[0] || '0');
        return hora >= 12;
      });
    }
    return false;
  }, [viewMode, turmaId, turmas, horarios]);

  // Filtrar slots por turno da turma selecionada
  const timeSlots = useMemo(() => {
    if (viewMode === 'turma' && turmaId) {
      const turma = turmas.find(t => t.id === turmaId);
      if (turma) {
        if (turma.turno === 'Matutino') {
          return DEFAULT_TIME_SLOTS.slice(0, 7); // 7 tempos matutino
        } else if (turma.turno === 'Vespertino') {
          return DEFAULT_TIME_SLOTS.slice(7); // 7 tempos vespertino
        }
      }
    }
    return DEFAULT_TIME_SLOTS;
  }, [viewMode, turmaId, turmas]);

  // Slots de sexta vespertino (35 min cada)
  const sextaVespertinoSlots = SEXTA_VESPERTINO_SLOTS;

  // Obter horario em um slot especifico
  const getHorarioAt = useCallback((horaInicio: string, horaFim: string, diaSemana: DiaSemana): HorarioAula | null => {
    return horarios.find(
      h => h.horaInicio === horaInicio && h.horaFim === horaFim && h.diaSemana === diaSemana
    ) || null;
  }, [horarios]);

  // Abrir modal para novo/editar
  const openModal = useCallback((horario?: HorarioAula, slot?: { dia: DiaSemana; slot: HorarioSlot }) => {
    setEditingHorario(horario || null);
    setSelectedSlot(slot || null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setEditingHorario(null);
    setSelectedSlot(null);
    setModalOpen(false);
  }, []);

  // Limpar selecao ao trocar viewMode
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'turma') {
      setProfessorId('');
    } else {
      setTurmaId('');
    }
  }, []);

  return {
    // Visualizacao
    gridViewType,
    setGridViewType,
    // Filtros
    ano,
    setAno,
    turmaId,
    setTurmaId,
    professorId,
    setProfessorId,
    viewMode,
    setViewMode: handleViewModeChange,

    // Dados
    horarios,
    turmas,
    disciplinas,
    professores,
    loading,
    error,

    // Grid
    timeSlots,
    sextaVespertinoSlots,
    isVespertino,
    getHorarioAt,

    // Modal
    editingHorario,
    selectedSlot,
    modalOpen,
    openModal,
    closeModal,

    // Permissoes
    canEdit,
    canSendWhatsApp: isCoordinatorOrAbove(),
    userIsProfessor,
    usuario,

    // Acoes
    ...actions,
    refetch,
  };
}
