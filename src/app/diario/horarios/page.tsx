'use client';

/**
 * Pagina de horarios - visualiza e edita grade de horarios de aulas.
 * Acesso: professor (view), coordenador+ (edit)
 */

import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { Schedule } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { useHorariosData } from './hooks';
import {
  HorariosFilters,
  HorarioGrid,
  HorarioModal,
  WhatsAppSendButton,
} from './components';

export default function HorariosPage() {
  const { can } = usePermissions();
  const canView = can('horarios:view');

  const {
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
    // Acoes
    createHorario,
    updateHorario,
    deleteHorario,
    sendScheduleToWhatsApp,
    saving,
    sending,
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
  const hasSelection = viewMode === 'turma' ? !!turmaId : !!professorId;

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

          {/* WhatsApp button para visualizacao de professor */}
          {viewMode === 'professor' && selectedProfessor && horarios.length > 0 && (
            <WhatsAppSendButton
              professor={selectedProfessor}
              horarios={horarios}
              turmas={turmas}
              disciplinas={disciplinas}
              onSend={sendScheduleToWhatsApp}
              sending={sending}
            />
          )}
        </Box>

        {/* Erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filtros */}
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
          onClose={closeModal}
          onCreate={createHorario}
          onUpdate={updateHorario}
          onDelete={deleteHorario}
        />
      </Box>
    </MainLayout>
  );
}
