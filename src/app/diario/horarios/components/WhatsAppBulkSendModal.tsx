/**
 * Modal para envio em massa de horarios via WhatsApp.
 * Permite escolher entre enviar como texto ou imagem,
 * e selecionar quais professores devem receber.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  LinearProgress,
  Divider,
  FormControlLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  Close,
  TextFields,
  Image as ImageIcon,
  Person,
  CheckCircle,
  Error as ErrorIcon,
  ArrowBack,
  ArrowForward,
  Send,
  WbSunny,
  NightsStay,
} from '@mui/icons-material';
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

type SendType = 'texto' | 'imagem';
type TurnoView = 'matutino' | 'vespertino' | 'ambos';

interface SendResult {
  professorId: string;
  professorNome: string;
  success: boolean;
  error?: string;
}

interface WhatsAppBulkSendModalProps {
  open: boolean;
  onClose: () => void;
  professores: Usuario[];
  horarios: HorarioAula[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  ano: number;
  onSendText: (
    professor: Usuario,
    horarios: HorarioAula[],
    turmas: Turma[],
    disciplinas: Disciplina[]
  ) => Promise<boolean>;
  enviadoPorId?: string;
  enviadoPorNome?: string;
}

// Converte horario HH:MM para minutos desde meia-noite
const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function WhatsAppBulkSendModal({
  open,
  onClose,
  professores,
  horarios,
  turmas,
  disciplinas,
  ano,
  onSendText,
  enviadoPorId,
  enviadoPorNome,
}: WhatsAppBulkSendModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [sendType, setSendType] = useState<SendType>('texto');
  const [turnoView, setTurnoView] = useState<TurnoView>('matutino');
  const [selectedProfessores, setSelectedProfessores] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SendResult[]>([]);
  const [currentProfessor, setCurrentProfessor] = useState<string | null>(null);
  const [renderingProfessor, setRenderingProfessor] = useState<Usuario | null>(null);
  const [renderingTurno, setRenderingTurno] = useState<'Matutino' | 'Vespertino' | 'Ambos'>('Matutino');
  const tableRef = useRef<HTMLDivElement>(null);

  const steps = ['Tipo de Envio', 'Selecionar Professores', 'Resultado'];

  // Filtrar professores com celular e horarios
  const professoresComCelular = professores.filter(p => {
    if (!p.celular || !p.ativo) return false;
    const profHorarios = horarios.filter(h =>
      h.professorIds?.includes(p.id) || h.professorId === p.id
    );
    return profHorarios.length > 0;
  });

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSendType('texto');
      setTurnoView('matutino');
      setSelectedProfessores([]);
      setSending(false);
      setProgress(0);
      setResults([]);
      setCurrentProfessor(null);
      setRenderingProfessor(null);
    }
  }, [open]);

  // Obter horarios de um professor
  const getHorariosProfessor = useCallback((professorId: string) => {
    return horarios.filter(h =>
      h.professorIds?.includes(professorId) || h.professorId === professorId
    );
  }, [horarios]);

  // Verificar se professor tem horarios no turno
  const professorHasTurno = useCallback((professorId: string, turno: 'matutino' | 'vespertino') => {
    const profHorarios = getHorariosProfessor(professorId);
    return profHorarios.some(h => {
      const hora = parseInt(h.horaInicio.split(':')[0] || '0');
      return turno === 'matutino' ? hora < 12 : hora >= 12;
    });
  }, [getHorariosProfessor]);

  // Toggle selecionar todos
  const handleToggleAll = () => {
    if (selectedProfessores.length === professoresComCelular.length) {
      setSelectedProfessores([]);
    } else {
      setSelectedProfessores(professoresComCelular.map(p => p.id));
    }
  };

  // Toggle professor individual
  const handleToggleProfessor = (professorId: string) => {
    setSelectedProfessores(prev => {
      if (prev.includes(professorId)) {
        return prev.filter(id => id !== professorId);
      }
      return [...prev, professorId];
    });
  };

  // Obter slots baseado no turno e dia
  const getSlots = (turno: 'Matutino' | 'Vespertino', dia: DiaSemana) => {
    if (turno === 'Vespertino' && dia === 5) {
      return SEXTA_VESPERTINO_SLOTS;
    }
    return turno === 'Matutino' ? MATUTINO_SLOTS : VESPERTINO_SLOTS;
  };

  // Buscar horario para um slot e dia
  const getHorarioAt = (profHorarios: HorarioAula[], slotIndex: number, dia: DiaSemana, turno: 'Matutino' | 'Vespertino') => {
    const slots = getSlots(turno, dia);
    const slot = slots[slotIndex];
    if (!slot) return null;

    const slotStart = timeToMinutes(slot.horaInicio);
    const slotEnd = timeToMinutes(slot.horaFim);

    return profHorarios.find(h => {
      if (h.diaSemana !== dia) return false;

      const hStart = timeToMinutes(h.horaInicio);
      const hEnd = timeToMinutes(h.horaFim);
      const midpoint = (hStart + hEnd) / 2;

      return midpoint >= slotStart && midpoint < slotEnd;
    }) || null;
  };

  // Obter disciplinas do professor para o turno
  const getDisciplinasProfessor = (profHorarios: HorarioAula[], turno: TurnoView) => {
    const horariosDoTurno = turno === 'ambos'
      ? profHorarios
      : profHorarios.filter(h => {
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
  const getTurnoLabel = (turno: TurnoView, hasMatutino: boolean, hasVespertino: boolean) => {
    if (turno === 'matutino') return 'Matutino';
    if (turno === 'vespertino') return 'Vespertino';
    if (hasMatutino && hasVespertino) return 'Integral';
    if (hasMatutino) return 'Matutino';
    return 'Vespertino';
  };

  // Gerar imagem como base64 para um professor (requer que o DOM esteja renderizado)
  const generateImageBase64 = async (): Promise<string | null> => {
    if (!tableRef.current) return null;

    try {
      // Aguardar renderizacao
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      return canvas.toDataURL('image/png').split(',')[1];
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      return null;
    }
  };

  // Enviar imagem para um professor
  const sendImageToProfessor = async (
    professor: Usuario,
    imageBase64: string,
    turnoLabel: string
  ): Promise<boolean> => {
    const response = await fetch('/api/whatsapp/send-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinatarioId: professor.id,
        destinatarioNome: professor.nome,
        numero: professor.celular,
        imageBase64,
        caption: `Horario ${turnoLabel} - ${professor.nome} - Ano Letivo ${ano}`,
        enviadoPorId,
        enviadoPorNome,
      }),
    });

    const data = await response.json();
    return response.ok && data.success;
  };

  // Renderizar tabela de horarios para imagem
  const renderTable = (profHorarios: HorarioAula[], turno: 'Matutino' | 'Vespertino') => {
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
                const horario = getHorarioAt(profHorarios, index, dia, turno);
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

  // Enviar mensagens
  const handleSend = async () => {
    if (selectedProfessores.length === 0) return;

    setSending(true);
    setActiveStep(2);
    setProgress(0);
    setResults([]);

    const total = selectedProfessores.length;
    const newResults: SendResult[] = [];

    for (let i = 0; i < selectedProfessores.length; i++) {
      const professorId = selectedProfessores[i];
      const professor = professores.find(p => p.id === professorId);

      if (!professor) continue;

      setCurrentProfessor(professor.nome);
      const profHorarios = getHorariosProfessor(professorId);
      const hasMatutino = profHorarios.some(h => parseInt(h.horaInicio.split(':')[0] || '0') < 12);
      const hasVespertino = profHorarios.some(h => parseInt(h.horaInicio.split(':')[0] || '0') >= 12);

      try {
        let success = false;
        let errorMsg = '';

        if (sendType === 'texto') {
          // Enviar texto
          success = await onSendText(professor, profHorarios, turmas, disciplinas);
        } else {
          // Enviar imagem - UMA imagem por professor baseado no turno selecionado
          let turnoToRender: 'Matutino' | 'Vespertino' | 'Ambos';
          let turnoLabel: string;
          let canSend = false;

          if (turnoView === 'matutino') {
            if (hasMatutino) {
              turnoToRender = 'Matutino';
              turnoLabel = 'Matutino';
              canSend = true;
            }
          } else if (turnoView === 'vespertino') {
            if (hasVespertino) {
              turnoToRender = 'Vespertino';
              turnoLabel = 'Vespertino';
              canSend = true;
            }
          } else if (turnoView === 'ambos') {
            // Integral: UMA imagem com ambos os turnos
            if (hasMatutino || hasVespertino) {
              turnoToRender = 'Ambos';
              turnoLabel = hasMatutino && hasVespertino ? 'Integral' : (hasMatutino ? 'Matutino' : 'Vespertino');
              canSend = true;
            }
          }

          // Se professor não tem aulas no turno selecionado, pular
          if (!canSend) {
            newResults.push({
              professorId,
              professorNome: professor.nome,
              success: false,
              error: `Professor não tem aulas no turno ${turnoView}`,
            });
            setResults([...newResults]);
            setProgress(((i + 1) / total) * 100);
            continue;
          }

          // Renderizar tabela para este professor/turno
          setRenderingProfessor(professor);
          setRenderingTurno(turnoToRender!);

          // Aguardar renderizacao do DOM
          await new Promise(resolve => setTimeout(resolve, 300));

          // Gerar imagem
          const imageBase64 = await generateImageBase64();

          if (!imageBase64) {
            errorMsg = 'Falha ao gerar imagem';
          } else {
            // Enviar imagem
            const sent = await sendImageToProfessor(professor, imageBase64, turnoLabel!);

            if (sent) {
              success = true;
            } else {
              errorMsg = 'Falha ao enviar imagem';
            }
          }
        }

        newResults.push({
          professorId,
          professorNome: professor.nome,
          success,
          error: success ? undefined : errorMsg,
        });
      } catch (error) {
        newResults.push({
          professorId,
          professorNome: professor.nome,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }

      setResults([...newResults]);
      setProgress(((i + 1) / total) * 100);

      // Delay entre envios para evitar ban
      if (i < selectedProfessores.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setCurrentProfessor(null);
    setRenderingProfessor(null);
    setSending(false);
  };

  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;

  // Preparar dados para renderizar tabela oculta (para geracao de imagem)
  const renderingProfHorarios = renderingProfessor
    ? getHorariosProfessor(renderingProfessor.id)
    : [];

  return (
    <Dialog
      open={open}
      onClose={sending ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: 500 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box component="span">Enviar Horarios via WhatsApp</Box>
        <IconButton onClick={onClose} disabled={sending} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: Tipo de Envio */}
        {activeStep === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h6" gutterBottom>
              Como deseja enviar os horarios?
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Escolha entre enviar como mensagem de texto ou como imagem
            </Typography>

            <ToggleButtonGroup
              value={sendType}
              exclusive
              onChange={(_, value) => value && setSendType(value)}
              sx={{ mb: 3 }}
            >
              <ToggleButton value="texto" sx={{ px: 4, py: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <TextFields sx={{ fontSize: 40 }} />
                  <Typography>Texto</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Mensagem formatada
                  </Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="imagem" sx={{ px: 4, py: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <ImageIcon sx={{ fontSize: 40 }} />
                  <Typography>Imagem</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tabela visual
                  </Typography>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>

            {sendType === 'imagem' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Turno da imagem:
                </Typography>
                <ToggleButtonGroup
                  value={turnoView}
                  exclusive
                  onChange={(_, value) => value && setTurnoView(value)}
                  size="small"
                >
                  <ToggleButton value="matutino">
                    <WbSunny sx={{ mr: 1 }} />
                    Matutino
                  </ToggleButton>
                  <ToggleButton value="vespertino">
                    <NightsStay sx={{ mr: 1 }} />
                    Vespertino
                  </ToggleButton>
                  <ToggleButton value="ambos">
                    Integral
                  </ToggleButton>
                </ToggleButtonGroup>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Se o professor nao tiver aulas no turno selecionado, sera enviado o turno disponivel
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Step 1: Selecionar Professores */}
        {activeStep === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Selecione os professores ({selectedProfessores.length} de {professoresComCelular.length})
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedProfessores.length === professoresComCelular.length}
                    indeterminate={selectedProfessores.length > 0 && selectedProfessores.length < professoresComCelular.length}
                    onChange={handleToggleAll}
                  />
                }
                label="Selecionar todos"
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            <List sx={{ maxHeight: 350, overflow: 'auto' }}>
              {professoresComCelular.map(professor => {
                const profHorarios = getHorariosProfessor(professor.id);
                const hasMatutino = professorHasTurno(professor.id, 'matutino');
                const hasVespertino = professorHasTurno(professor.id, 'vespertino');
                const isSelected = selectedProfessores.includes(professor.id);

                return (
                  <ListItem key={professor.id} disablePadding>
                    <ListItemButton onClick={() => handleToggleProfessor(professor.id)} dense>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={isSelected}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: isSelected ? 'primary.main' : 'grey.400' }}>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={professor.nome}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            {hasMatutino && <Chip label="Matutino" size="small" color="warning" variant="outlined" />}
                            {hasVespertino && <Chip label="Vespertino" size="small" color="info" variant="outlined" />}
                            <Chip label={`${profHorarios.length} aulas`} size="small" variant="outlined" />
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>

            {professoresComCelular.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Nenhum professor com celular cadastrado e horarios no ano {ano}.
              </Alert>
            )}
          </Box>
        )}

        {/* Step 2: Resultado */}
        {activeStep === 2 && (
          <Box>
            {sending ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Enviando mensagens...
                </Typography>
                {currentProfessor && (
                  <Typography color="text.secondary" gutterBottom>
                    Enviando para: {currentProfessor}
                  </Typography>
                )}
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(progress)}% ({results.length} de {selectedProfessores.length})
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center' }}>
                  <Chip
                    icon={<CheckCircle />}
                    label={`${successCount} enviados`}
                    color="success"
                    variant="filled"
                  />
                  {failedCount > 0 && (
                    <Chip
                      icon={<ErrorIcon />}
                      label={`${failedCount} falharam`}
                      color="error"
                      variant="filled"
                    />
                  )}
                </Box>

                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {results.map(result => (
                    <ListItem key={result.professorId}>
                      <ListItemIcon>
                        {result.success ? (
                          <CheckCircle color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={result.professorNome}
                        secondary={result.error || (result.success ? 'Enviado com sucesso' : 'Falha no envio')}
                        secondaryTypographyProps={{
                          color: result.success ? 'success.main' : 'error.main',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}

        {/* Tabela oculta para geracao de imagem */}
        {renderingProfessor && sendType === 'imagem' && (
          <Box
            sx={{
              position: 'fixed',
              left: '-9999px',
              top: 0,
              pointerEvents: 'none',
            }}
          >
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
                  PROFESSOR(A): {renderingProfessor.nome} - {renderingTurno === 'Ambos' ? 'Integral' : renderingTurno}
                </Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem', mt: 0.5 }}>
                  DISCIPLINAS: {getDisciplinasProfessor(renderingProfHorarios, renderingTurno === 'Ambos' ? 'ambos' : renderingTurno.toLowerCase() as TurnoView) || 'Nenhuma'}
                </Typography>
              </Box>

              {/* Tabela(s) */}
              {renderingTurno === 'Ambos' ? (
                <>
                  {/* Matutino */}
                  {renderingProfHorarios.some(h => parseInt(h.horaInicio.split(':')[0] || '0') < 12) && (
                    <Box sx={{ mb: 2 }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem', mb: 1, color: '#ed6c02' }}>
                        MATUTINO
                      </Typography>
                      {renderTable(renderingProfHorarios, 'Matutino')}
                    </Box>
                  )}
                  {/* Vespertino */}
                  {renderingProfHorarios.some(h => parseInt(h.horaInicio.split(':')[0] || '0') >= 12) && (
                    <Box>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem', mb: 1, color: '#0288d1' }}>
                        VESPERTINO
                      </Typography>
                      {renderTable(renderingProfHorarios, 'Vespertino')}
                    </Box>
                  )}
                </>
              ) : (
                renderTable(renderingProfHorarios, renderingTurno as 'Matutino' | 'Vespertino')
              )}

              {/* Footer */}
              <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid #ccc', textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">
                  Ano Letivo {ano} - Gerado em {new Date().toLocaleDateString('pt-BR')}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {activeStep === 0 && (
          <>
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={() => setActiveStep(1)}
            >
              Proximo
            </Button>
          </>
        )}

        {activeStep === 1 && (
          <>
            <Button startIcon={<ArrowBack />} onClick={() => setActiveStep(0)}>
              Voltar
            </Button>
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Send />}
              onClick={handleSend}
              disabled={selectedProfessores.length === 0}
            >
              Enviar para {selectedProfessores.length} professor{selectedProfessores.length !== 1 ? 'es' : ''}
            </Button>
          </>
        )}

        {activeStep === 2 && !sending && (
          <Button variant="contained" onClick={onClose}>
            Fechar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
