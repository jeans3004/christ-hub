'use client';

/**
 * Pagina de horarios - visualiza e edita grade de horarios de aulas.
 * Acesso: professor (view), coordenador+ (edit)
 */

import { Box, Typography, CircularProgress, Alert, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Schedule, ViewModule, ViewList } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { useHorariosData } from './hooks';
import {
  HorariosFilters,
  HorarioGrid,
  HorarioGridByTurno,
  HorarioModal,
  WhatsAppSendButton,
} from './components';
import { DiaSemana, HorarioSlot } from '@/types';

export default function HorariosPage() {
  const { can } = usePermissions();
  const canView = can('horarios:view');

  const {
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
    setViewMode,
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
    // Modal
    editingHorario,
    selectedSlot,
    modalOpen,
    openModal,
    closeModal,
    // Permissoes
    canEdit,
    canSendWhatsApp,
    userIsProfessor,
    // Acoes
    createHorario,
    updateHorario,
    deleteHorario,
    sendScheduleToWhatsApp,
    sendScheduleToAllProfessors,
    saving,
    sending,
    refetch,
  } = useHorariosData();

  // Verificar permissao
  if (!canView) {
    return (
      <MainLayout title="Horarios">
        <Box sx={{ p: 4 }}>
          <Alert severity="error">
            Voce nao tem permissao para acessar esta pagina.
          </Alert>
        </Box>
      </MainLayout>
    );
  }

  const selectedProfessor = professores.find(p => p.id === professorId);
  const isAllProfessors = professorId === 'todos';
  const hasSelection = viewMode === 'turma' ? !!turmaId : (!!professorId || isAllProfessors);

  // Handler para click na grade por turno (passa turmaId adicional)
  const handleGridByTurnoClick = (
    horario?: typeof horarios[0],
    slot?: { dia: DiaSemana; slot: HorarioSlot; turmaId: string }
  ) => {
    if (slot) {
      // Setar a turma selecionada antes de abrir o modal
      setTurmaId(slot.turmaId);
      openModal(horario, { dia: slot.dia, slot: slot.slot });
    } else {
      openModal(horario);
    }
  };

  return (
    <MainLayout title="Horarios">
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Horarios
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Toggle de visualizacao */}
            <ToggleButtonGroup
              value={gridViewType}
              exclusive
              onChange={(_, value) => value && setGridViewType(value)}
              size="small"
            >
              <ToggleButton value="grade" title="Grade por Turno">
                <ViewModule />
              </ToggleButton>
              <ToggleButton value="individual" title="Individual">
                <ViewList />
              </ToggleButton>
            </ToggleButtonGroup>

            {/* WhatsApp button para visualizacao de professor (apenas coordenadores+) */}
            {canSendWhatsApp && gridViewType === 'individual' && viewMode === 'professor' && (selectedProfessor || isAllProfessors) && horarios.length > 0 && (
              <WhatsAppSendButton
                professor={isAllProfessors ? null : selectedProfessor}
                allProfessors={isAllProfessors ? professores : undefined}
                horarios={horarios}
                turmas={turmas}
                disciplinas={disciplinas}
                onSend={sendScheduleToWhatsApp}
                onSendToAll={sendScheduleToAllProfessors}
                sending={sending}
              />
            )}
          </Box>
        </Box>

        {/* Erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Visualizacao por Grade (Matutino/Vespertino) */}
        {gridViewType === 'grade' ? (
          <>
            {/* Filtro de ano apenas */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <HorariosFilters
                ano={ano}
                setAno={setAno}
                turmaId={turmaId}
                setTurmaId={setTurmaId}
                professorId={professorId}
                setProfessorId={setProfessorId}
                viewMode={viewMode}
                setViewMode={setViewMode}
                turmas={turmas}
                professores={professores}
                loading={loading}
                showOnlyAno
              />
            </Paper>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Matutino */}
                <Box>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: 'warning.main', borderRadius: '50%' }} />
                    Matutino
                  </Typography>
                  <HorarioGridByTurno
                    turno="Matutino"
                    horarios={horarios}
                    turmas={turmas}
                    disciplinas={disciplinas}
                    professores={professores}
                    canEdit={canEdit}
                    onCellClick={handleGridByTurnoClick}
                  />
                </Box>

                {/* Vespertino */}
                <Box>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: 'info.main', borderRadius: '50%' }} />
                    Vespertino
                  </Typography>
                  <HorarioGridByTurno
                    turno="Vespertino"
                    horarios={horarios}
                    turmas={turmas}
                    disciplinas={disciplinas}
                    professores={professores}
                    canEdit={canEdit}
                    onCellClick={handleGridByTurnoClick}
                  />
                </Box>
              </Box>
            )}
          </>
        ) : (
          <>
            {/* Filtros completos para visualizacao individual */}
            <HorariosFilters
              ano={ano}
              setAno={setAno}
              turmaId={turmaId}
              setTurmaId={setTurmaId}
              professorId={professorId}
              setProfessorId={setProfessorId}
              viewMode={viewMode}
              setViewMode={setViewMode}
              turmas={turmas}
              professores={professores}
              loading={loading}
            />

            {/* Conteudo Principal */}
            {!hasSelection ? (
              <Paper sx={{ p: 6, textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Selecione {viewMode === 'turma' ? 'uma turma' : 'um professor'} para visualizar os horarios
                </Typography>
              </Paper>
            ) : loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Paper sx={{ p: 2, overflow: 'auto' }}>
                <HorarioGrid
                  horarios={horarios}
                  turmas={turmas}
                  disciplinas={disciplinas}
                  professores={professores}
                  timeSlots={timeSlots}
                  sextaVespertinoSlots={sextaVespertinoSlots}
                  isVespertino={isVespertino}
                  canEdit={canEdit}
                  onCellClick={openModal}
                  viewMode={viewMode}
                />
              </Paper>
            )}
          </>
        )}

        {/* Modal de Formulario */}
        <HorarioModal
          open={modalOpen}
          horario={editingHorario}
          turmas={turmas}
          disciplinas={disciplinas}
          professores={professores}
          turmaId={turmaId}
          professorId={professorId}
          ano={ano}
          selectedSlot={selectedSlot}
          saving={saving}
          readOnly={!canEdit}
          onClose={() => {
            closeModal();
            // Recarregar dados ao fechar modal na visualizacao de grade
            if (gridViewType === 'grade') {
              refetch();
            }
          }}
          onCreate={createHorario}
          onUpdate={updateHorario}
          onDelete={deleteHorario}
        />
      </Box>
    </MainLayout>
  );
}
