'use client';

/**
 * Pagina de horarios - visualiza e edita grade de horarios de aulas.
 * Acesso: professor (view), coordenador+ (edit)
 */

import { useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, ToggleButton, ToggleButtonGroup, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { Schedule, ViewModule, ViewList, DeleteSweep, FileUpload, PersonOff } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { useHorariosData } from './hooks';
import {
  HorariosFilters,
  HorarioGrid,
  HorarioGridByTurno,
  HorarioModal,
  WhatsAppSendButton,
  ImportHorariosModal,
  DownloadHorarioImage,
} from './components';
import { DiaSemana, HorarioSlot } from '@/types';

export default function HorariosPage() {
  const { can } = usePermissions();
  const canView = can('horarios:view');
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [modoPessoal, setModoPessoal] = useState(false);
  const [clearPessoalDialogOpen, setClearPessoalDialogOpen] = useState(false);

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
    usuario,
    // Acoes
    createHorario,
    updateHorario,
    deleteHorario,
    deleteAllHorarios,
    importMultipleHorarios,
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

  // Professor pode adicionar horarios pessoais na visualizacao de professor (seu proprio ou visto por coordenador)
  const canAddPessoal = userIsProfessor && viewMode === 'professor' && professorId === usuario?.id;

  // Horarios pessoais do professor logado
  const horariosPessoais = horarios.filter(h => h.pessoal && h.createdBy === usuario?.id);
  const canDeletePessoal = viewMode === 'professor' && professorId === usuario?.id && horariosPessoais.length > 0;

  // Handler para adicionar horario pessoal
  const handleAddPessoal = (slot: { dia: DiaSemana; slot: HorarioSlot }) => {
    setModoPessoal(true);
    openModal(undefined, slot);
  };

  // Handler para abrir modal normal (reseta modoPessoal)
  const handleOpenModal = (horario?: typeof horarios[0], slot?: { dia: DiaSemana; slot: HorarioSlot }) => {
    // Se e um horario pessoal, manter o modo pessoal
    setModoPessoal(horario?.pessoal || false);
    openModal(horario, slot);
  };

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
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 3,
            gap: { xs: 1.5, sm: 2 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule color="primary" />
            <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Horarios
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            }}
          >
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

            {/* Botao Importar Planilha (apenas coordenadores+) */}
            {canEdit && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => setImportModalOpen(true)}
                disabled={saving}
                sx={{
                  minWidth: { xs: 40, sm: 'auto' },
                  px: { xs: 1, sm: 2 },
                }}
                title="Importar Planilha"
              >
                <FileUpload sx={{ mr: { xs: 0, sm: 1 } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Importar
                </Box>
              </Button>
            )}

            {/* Botao Limpar Todos (apenas coordenadores+) */}
            {canEdit && horarios.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setClearAllDialogOpen(true)}
                disabled={saving}
                sx={{
                  minWidth: { xs: 40, sm: 'auto' },
                  px: { xs: 1, sm: 2 },
                }}
                title="Limpar Todos"
              >
                <DeleteSweep sx={{ mr: { xs: 0, sm: 1 } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Limpar Todos
                </Box>
              </Button>
            )}

            {/* WhatsApp button para visualizacao de professor (apenas coordenadores+) */}
            {canSendWhatsApp && gridViewType === 'individual' && viewMode === 'professor' && (selectedProfessor || isAllProfessors) && horarios.length > 0 && (
              <WhatsAppSendButton
                professor={isAllProfessors ? null : selectedProfessor}
                allProfessors={isAllProfessors ? professores : undefined}
                horarios={horarios}
                turmas={turmas}
                disciplinas={disciplinas}
                ano={ano}
                onSend={sendScheduleToWhatsApp}
                onSendToAll={sendScheduleToAllProfessors}
                sending={sending}
                enviadoPorId={usuario?.id}
                enviadoPorNome={usuario?.nome}
              />
            )}

            {/* Botao Download Imagem para visualizacao de professor individual */}
            {gridViewType === 'individual' && viewMode === 'professor' && selectedProfessor && !isAllProfessors && horarios.length > 0 && (
              <DownloadHorarioImage
                professor={selectedProfessor}
                horarios={horarios}
                turmas={turmas}
                disciplinas={disciplinas}
                ano={ano}
                enviadoPorId={usuario?.id}
                enviadoPorNome={usuario?.nome}
              />
            )}

            {/* Botao Limpar Horarios Pessoais (apenas para professor vendo seus proprios horarios) */}
            {canDeletePessoal && gridViewType === 'individual' && (
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={() => setClearPessoalDialogOpen(true)}
                disabled={saving}
                sx={{
                  minWidth: { xs: 40, sm: 'auto' },
                  px: { xs: 1, sm: 2 },
                }}
                title={`Limpar Pessoais (${horariosPessoais.length})`}
              >
                <PersonOff sx={{ mr: { xs: 0, sm: 1 } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Limpar Pessoais ({horariosPessoais.length})
                </Box>
              </Button>
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
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  mx: { xs: -2, sm: 0 },
                }}
              >
                {/* Matutino */}
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: { xs: 2, sm: 0 },
                    }}
                  >
                    <Box sx={{ width: 12, height: 12, bgcolor: 'warning.main', borderRadius: '50%' }} />
                    Matutino
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: { xs: 0, sm: 1 },
                      overflow: 'auto',
                      WebkitOverflowScrolling: 'touch',
                      '&::-webkit-scrollbar': { height: 6 },
                      '&::-webkit-scrollbar-thumb': { bgcolor: 'primary.light', borderRadius: 3 },
                    }}
                  >
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
                </Box>

                {/* Vespertino */}
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: { xs: 2, sm: 0 },
                    }}
                  >
                    <Box sx={{ width: 12, height: 12, bgcolor: 'info.main', borderRadius: '50%' }} />
                    Vespertino
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: { xs: 0, sm: 1 },
                      overflow: 'auto',
                      WebkitOverflowScrolling: 'touch',
                      '&::-webkit-scrollbar': { height: 6 },
                      '&::-webkit-scrollbar-thumb': { bgcolor: 'primary.light', borderRadius: 3 },
                    }}
                  >
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
              <Paper
                sx={{
                  p: { xs: 1, sm: 2 },
                  overflow: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  mx: { xs: -2, sm: 0 },
                  borderRadius: { xs: 0, sm: 1 },
                }}
              >
                <HorarioGrid
                  horarios={horarios}
                  turmas={turmas}
                  disciplinas={disciplinas}
                  professores={professores}
                  timeSlots={timeSlots}
                  sextaVespertinoSlots={sextaVespertinoSlots}
                  isVespertino={isVespertino}
                  canEdit={canEdit}
                  canAddPessoal={canAddPessoal}
                  onCellClick={handleOpenModal}
                  onAddPessoal={handleAddPessoal}
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
          readOnly={!canEdit && !modoPessoal}
          modoPessoal={modoPessoal}
          usuarioId={usuario?.id}
          onClose={() => {
            closeModal();
            setModoPessoal(false);
            // Recarregar dados ao fechar modal na visualizacao de grade
            if (gridViewType === 'grade') {
              refetch();
            }
          }}
          onCreate={createHorario}
          onUpdate={updateHorario}
          onDelete={deleteHorario}
        />

        {/* Dialog de Confirmacao - Limpar Todos */}
        <Dialog
          open={clearAllDialogOpen}
          onClose={() => setClearAllDialogOpen(false)}
        >
          <DialogTitle>Limpar Todos os Horarios</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem certeza que deseja remover todos os {horarios.length} horarios do ano {ano}?
              Esta acao nao pode ser desfeita.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearAllDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              color="error"
              variant="contained"
              disabled={saving}
              onClick={async () => {
                await deleteAllHorarios(ano);
                setClearAllDialogOpen(false);
                refetch();
              }}
            >
              {saving ? 'Removendo...' : 'Confirmar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de Confirmacao - Limpar Horarios Pessoais */}
        <Dialog
          open={clearPessoalDialogOpen}
          onClose={() => setClearPessoalDialogOpen(false)}
        >
          <DialogTitle>Limpar Horarios Pessoais</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem certeza que deseja remover todos os seus {horariosPessoais.length} horarios pessoais?
              Esta acao nao pode ser desfeita.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearPessoalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              color="warning"
              variant="contained"
              disabled={saving}
              onClick={async () => {
                // Deletar todos os horarios pessoais do usuario
                for (const h of horariosPessoais) {
                  await deleteHorario(h.id);
                }
                setClearPessoalDialogOpen(false);
                refetch();
              }}
            >
              {saving ? 'Removendo...' : 'Confirmar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Importacao */}
        <ImportHorariosModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          turmas={turmas}
          disciplinas={disciplinas}
          professores={professores}
          ano={ano}
          onImport={async (horarios) => {
            const count = await importMultipleHorarios(horarios);
            if (count > 0) {
              refetch();
            }
            return count;
          }}
        />
      </Box>
    </MainLayout>
  );
}
