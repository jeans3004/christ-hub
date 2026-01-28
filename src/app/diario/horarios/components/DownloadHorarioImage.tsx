/**
 * Componente para download do horario do professor como imagem.
 * Layout baseado nos PDFs HorarioGradeGeral.pdf e HorarioGradeEspecifico.pdf
 */

import { useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Alert,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import { Download, Close, Image, WhatsApp, WbSunny, NightsStay, Schedule } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import { HorarioAula, Turma, Disciplina, Usuario, DiaSemana, HorarioSlot } from '@/types';

// Dias da semana
const DIAS_SEMANA: { dia: DiaSemana; nome: string }[] = [
  { dia: 1, nome: 'SEGUNDA-FEIRA' },
  { dia: 2, nome: 'TERÇA-FEIRA' },
  { dia: 3, nome: 'QUARTA-FEIRA' },
  { dia: 4, nome: 'QUINTA-FEIRA' },
  { dia: 5, nome: 'SEXTA-FEIRA' },
];

// Slots Matutino
const MATUTINO_SLOTS: HorarioSlot[] = [
  { horaInicio: '07:00', horaFim: '07:45', label: '1º' },
  { horaInicio: '07:45', horaFim: '08:30', label: '2º' },
  { horaInicio: '08:30', horaFim: '09:15', label: '3º' },
  { horaInicio: '09:15', horaFim: '10:00', label: '4º' },
  { horaInicio: '10:00', horaFim: '10:45', label: '5º' },
  { horaInicio: '10:45', horaFim: '11:30', label: '6º' },
  { horaInicio: '11:30', horaFim: '12:15', label: '7º' },
];

// Slots Vespertino
const VESPERTINO_SLOTS: HorarioSlot[] = [
  { horaInicio: '13:00', horaFim: '13:45', label: '1º' },
  { horaInicio: '13:45', horaFim: '14:30', label: '2º' },
  { horaInicio: '14:30', horaFim: '15:15', label: '3º' },
  { horaInicio: '15:15', horaFim: '16:00', label: '4º' },
  { horaInicio: '16:00', horaFim: '16:45', label: '5º' },
  { horaInicio: '16:45', horaFim: '17:30', label: '6º' },
  { horaInicio: '17:30', horaFim: '18:15', label: '7º' },
];

// Slots Sexta Vespertino (35 min)
const SEXTA_VESPERTINO_SLOTS: HorarioSlot[] = [
  { horaInicio: '13:00', horaFim: '13:35', label: '1º' },
  { horaInicio: '13:35', horaFim: '14:10', label: '2º' },
  { horaInicio: '14:10', horaFim: '14:45', label: '3º' },
  { horaInicio: '14:45', horaFim: '15:20', label: '4º' },
  { horaInicio: '15:20', horaFim: '15:55', label: '5º' },
  { horaInicio: '15:55', horaFim: '16:30', label: '6º' },
  { horaInicio: '16:30', horaFim: '17:05', label: '7º' },
];

type TurnoView = 'matutino' | 'vespertino' | 'ambos';

interface DownloadHorarioImageProps {
  professor: Usuario;
  horarios: HorarioAula[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  ano: number;
  enviadoPorId?: string;
  enviadoPorNome?: string;
}

// Converte horario HH:MM para minutos desde meia-noite
const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function DownloadHorarioImage({
  professor,
  horarios,
  turmas,
  disciplinas,
  ano,
  enviadoPorId,
  enviadoPorNome,
}: DownloadHorarioImageProps) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<TurnoView>('matutino');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const tableRef = useRef<HTMLDivElement>(null);

  // Verificar se professor tem telefone
  const professorPhone = professor.celular || professor.telefone;

  // Obter disciplinas do professor para o turno selecionado
  const getDisciplinasProfessor = (turno: TurnoView) => {
    const horariosDoTurno = turno === 'ambos'
      ? horarios
      : horarios.filter(h => {
          const hora = parseInt(h.horaInicio.split(':')[0] || '0');
          return turno === 'matutino' ? hora < 12 : hora >= 12;
        });
    const discIds = new Set(horariosDoTurno.map(h => h.disciplinaId));
    return Array.from(discIds)
      .map(id => disciplinas.find(d => d.id === id)?.nome)
      .filter(Boolean)
      .join(' / ');
  };

  // Obter label do turno
  const getTurnoLabel = (turno: TurnoView) => {
    if (turno === 'matutino') return 'Matutino';
    if (turno === 'vespertino') return 'Vespertino';
    if (hasMatutino && hasVespertino) return 'Integral';
    if (hasMatutino) return 'Matutino';
    return 'Vespertino';
  };

  // Obter slots baseado no turno e dia
  const getSlots = (turno: 'Matutino' | 'Vespertino', dia: DiaSemana) => {
    if (turno === 'Vespertino' && dia === 5) {
      return SEXTA_VESPERTINO_SLOTS;
    }
    return turno === 'Matutino' ? MATUTINO_SLOTS : VESPERTINO_SLOTS;
  };

  // Buscar horario para um slot e dia
  const getHorarioAt = (slotIndex: number, dia: DiaSemana, turno: 'Matutino' | 'Vespertino') => {
    const slots = getSlots(turno, dia);
    const slot = slots[slotIndex];
    if (!slot) return null;

    const slotStart = timeToMinutes(slot.horaInicio);
    const slotEnd = timeToMinutes(slot.horaFim);

    return horarios.find(h => {
      if (h.diaSemana !== dia) return false;

      const hStart = timeToMinutes(h.horaInicio);
      const hEnd = timeToMinutes(h.horaFim);
      const midpoint = (hStart + hEnd) / 2;

      return midpoint >= slotStart && midpoint < slotEnd;
    }) || null;
  };

  // Gerar imagem como base64
  const generateImageBase64 = async (): Promise<string | null> => {
    if (!tableRef.current) return null;

    try {
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      // Retorna apenas a parte base64 (remove o prefixo data:image/png;base64,)
      const dataUrl = canvas.toDataURL('image/png');
      return dataUrl.split(',')[1];
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      return null;
    }
  };

  // Download da imagem
  const handleDownload = async () => {
    if (!tableRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const turnoLabel = getTurnoLabel(selectedTurno);
      const link = document.createElement('a');
      link.download = `Horario_${professor.nome.replace(/\s+/g, '_')}_${turnoLabel}_${ano}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      setSnackbar({ open: true, message: 'Erro ao gerar imagem', severity: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  // Enviar via WhatsApp
  const handleSendWhatsApp = async () => {
    if (!professorPhone) {
      setSnackbar({ open: true, message: 'Professor nao possui telefone cadastrado', severity: 'error' });
      return;
    }

    if (!enviadoPorId || !enviadoPorNome) {
      setSnackbar({ open: true, message: 'Dados do remetente nao disponiveis', severity: 'error' });
      return;
    }

    setSendingWhatsApp(true);
    try {
      const imageBase64 = await generateImageBase64();
      if (!imageBase64) {
        throw new Error('Falha ao gerar imagem');
      }

      const turnoLabel = getTurnoLabel(selectedTurno);
      const response = await fetch('/api/whatsapp/send-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarioId: professor.id,
          destinatarioNome: professor.nome,
          numero: professorPhone,
          imageBase64,
          caption: `Horario ${turnoLabel} - ${professor.nome} - Ano Letivo ${ano}`,
          enviadoPorId,
          enviadoPorNome,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao enviar imagem');
      }

      setSnackbar({ open: true, message: `Imagem ${turnoLabel} enviada com sucesso!`, severity: 'success' });
    } catch (error) {
      console.error('Erro ao enviar via WhatsApp:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Erro ao enviar via WhatsApp',
        severity: 'error',
      });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // Verificar se professor tem horarios em cada turno
  const hasMatutino = horarios.some(h => {
    const hora = parseInt(h.horaInicio.split(':')[0] || '0');
    return hora < 12;
  });
  const hasVespertino = horarios.some(h => {
    const hora = parseInt(h.horaInicio.split(':')[0] || '0');
    return hora >= 12;
  });

  // Definir turno inicial baseado nos horarios disponíveis
  const handleOpen = () => {
    if (hasMatutino) {
      setSelectedTurno('matutino');
    } else if (hasVespertino) {
      setSelectedTurno('vespertino');
    }
    setOpen(true);
  };

  // Renderizar tabela de horarios
  const renderTable = (turno: 'Matutino' | 'Vespertino') => {
    const slots = turno === 'Matutino' ? MATUTINO_SLOTS : VESPERTINO_SLOTS;

    return (
      <Table size="small" sx={{ border: '2px solid #000', borderCollapse: 'collapse' }}>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                border: '1px solid #000',
                bgcolor: '#f5f5f5',
                fontWeight: 'bold',
                width: 60,
                textAlign: 'center',
                p: 0.5,
              }}
            >
              TEMPO
            </TableCell>
            <TableCell
              sx={{
                border: '1px solid #000',
                bgcolor: '#f5f5f5',
                fontWeight: 'bold',
                width: 80,
                textAlign: 'center',
                p: 0.5,
              }}
            >
              Hora
            </TableCell>
            {DIAS_SEMANA.map(({ dia, nome }) => (
              <TableCell
                key={dia}
                sx={{
                  border: '1px solid #000',
                  bgcolor: '#f5f5f5',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  p: 0.5,
                  fontSize: '0.75rem',
                }}
              >
                {nome}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {slots.map((slot, index) => (
            <TableRow key={index}>
              <TableCell
                sx={{
                  border: '1px solid #000',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  p: 0.5,
                }}
              >
                {slot.label}
              </TableCell>
              <TableCell
                sx={{
                  border: '1px solid #000',
                  textAlign: 'center',
                  p: 0.5,
                  fontSize: '0.7rem',
                }}
              >
                {slot.horaInicio}
                <br />
                {slot.horaFim}
              </TableCell>
              {DIAS_SEMANA.map(({ dia }) => {
                const slotsForDay = getSlots(turno, dia);
                const daySlot = slotsForDay[index];
                const horario = getHorarioAt(index, dia, turno);
                const disciplina = horario ? disciplinas.find(d => d.id === horario.disciplinaId) : null;
                const turma = horario ? turmas.find(t => t.id === horario.turmaId) : null;

                return (
                  <TableCell
                    key={dia}
                    sx={{
                      border: '1px solid #000',
                      textAlign: 'center',
                      p: 0.5,
                      bgcolor: horario ? '#e8f5e9' : 'transparent',
                      minWidth: 100,
                    }}
                  >
                    {horario && (
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                          {disciplina?.nome || ''}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: '#666' }}>
                          {turma?.nome || ''}
                        </Typography>
                        {dia === 5 && turno === 'Vespertino' && (
                          <Typography sx={{ fontSize: '0.55rem', color: '#999' }}>
                            {daySlot?.horaInicio}-{daySlot?.horaFim}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const currentTurnoLabel = getTurnoLabel(selectedTurno);

  return (
    <>
      <Button
        variant="outlined"
        color="secondary"
        size="small"
        onClick={handleOpen}
        disabled={horarios.length === 0}
        sx={{
          minWidth: { xs: 40, sm: 'auto' },
          px: { xs: 1, sm: 2 },
        }}
        title="Baixar como Imagem"
      >
        <Image sx={{ mr: { xs: 0, sm: 1 } }} />
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          Baixar Imagem
        </Box>
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box component="span">Horario do Professor - {currentTurnoLabel}</Box>
          <IconButton onClick={() => setOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: '#f5f5f5' }}>
          {/* Seletor de Turno */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={selectedTurno}
              exclusive
              onChange={(_, value) => value && setSelectedTurno(value)}
              size="small"
            >
              <ToggleButton value="matutino" disabled={!hasMatutino}>
                <WbSunny sx={{ mr: 1 }} />
                Matutino
              </ToggleButton>
              <ToggleButton value="vespertino" disabled={!hasVespertino}>
                <NightsStay sx={{ mr: 1 }} />
                Vespertino
              </ToggleButton>
              {hasMatutino && hasVespertino && (
                <ToggleButton value="ambos">
                  <Schedule sx={{ mr: 1 }} />
                  Integral
                </ToggleButton>
              )}
            </ToggleButtonGroup>
          </Box>

          <Box
            ref={tableRef}
            sx={{
              bgcolor: '#fff',
              p: 3,
              minWidth: 800,
            }}
          >
            {/* Header */}
            <Box sx={{ mb: 2, borderBottom: '2px solid #000', pb: 1 }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                PROFESSOR(A): {professor.nome} - {currentTurnoLabel}
              </Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem', mt: 0.5 }}>
                DISCIPLINAS: {getDisciplinasProfessor(selectedTurno) || 'Nenhuma'}
              </Typography>
            </Box>

            {/* Tabela(s) do turno selecionado */}
            {selectedTurno === 'ambos' ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem', mb: 1, color: '#1976d2' }}>
                    <WbSunny sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                    MATUTINO
                  </Typography>
                  {renderTable('Matutino')}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem', mb: 1, color: '#7b1fa2' }}>
                    <NightsStay sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                    VESPERTINO
                  </Typography>
                  {renderTable('Vespertino')}
                </Box>
              </>
            ) : (
              <Box>
                {renderTable(selectedTurno === 'matutino' ? 'Matutino' : 'Vespertino')}
              </Box>
            )}

            {/* Footer */}
            <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid #ccc', textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">
                Ano Letivo {ano} - Gerado em {new Date().toLocaleDateString('pt-BR')}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', p: 2 }}>
          <Button onClick={() => setOpen(false)}>Fechar</Button>
          <Divider orientation="vertical" flexItem />
          <Button
            variant="contained"
            startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
            onClick={handleDownload}
            disabled={downloading || sendingWhatsApp}
          >
            {downloading ? 'Gerando...' : `Baixar ${currentTurnoLabel}`}
          </Button>
          {professorPhone && enviadoPorId && (
            <Button
              variant="contained"
              color="success"
              startIcon={sendingWhatsApp ? <CircularProgress size={16} color="inherit" /> : <WhatsApp />}
              onClick={handleSendWhatsApp}
              disabled={downloading || sendingWhatsApp}
            >
              {sendingWhatsApp ? 'Enviando...' : `WhatsApp ${currentTurnoLabel}`}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
