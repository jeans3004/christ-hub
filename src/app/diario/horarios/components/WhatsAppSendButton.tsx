/**
 * Botao para enviar horario via WhatsApp.
 */

import { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Today as TodayIcon,
  DateRange as WeekIcon,
  ArrowDropDown as ArrowIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { HorarioAula, Turma, Disciplina, Usuario, DiaSemana, DiasSemanaNomes } from '@/types';

interface WhatsAppSendButtonProps {
  professor?: Usuario | null;
  allProfessors?: Usuario[];
  horarios: HorarioAula[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  onSend: (
    professor: Usuario,
    horarios: HorarioAula[],
    turmas: Turma[],
    disciplinas: Disciplina[],
    dia?: DiaSemana
  ) => Promise<boolean>;
  onSendToAll?: (
    allHorarios: HorarioAula[],
    professores: Usuario[],
    turmas: Turma[],
    disciplinas: Disciplina[]
  ) => Promise<{ success: number; failed: number }>;
  sending: boolean;
}

// Obter o dia da semana atual (0-6)
function getCurrentDayOfWeek(): DiaSemana {
  return new Date().getDay() as DiaSemana;
}

export function WhatsAppSendButton({
  professor,
  allProfessors,
  horarios,
  turmas,
  disciplinas,
  onSend,
  onSendToAll,
  sending,
}: WhatsAppSendButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isAllMode = !professor && !!allProfessors;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handlers para professor individual
  const handleSendToday = async () => {
    if (!professor) return;
    handleClose();
    await onSend(professor, horarios, turmas, disciplinas, getCurrentDayOfWeek());
  };

  const handleSendWeek = async () => {
    if (!professor) return;
    handleClose();
    await onSend(professor, horarios, turmas, disciplinas);
  };

  const handleSendDay = async (dia: DiaSemana) => {
    if (!professor) return;
    handleClose();
    await onSend(professor, horarios, turmas, disciplinas, dia);
  };

  // Handler para todos os professores
  const handleSendToAllProfessors = async () => {
    if (!onSendToAll || !allProfessors) return;
    handleClose();
    await onSendToAll(horarios, allProfessors, turmas, disciplinas);
  };

  // Modo: Enviar para todos os professores
  if (isAllMode) {
    const professoresComCelular = allProfessors?.filter(p => p.celular && p.ativo) || [];

    return (
      <Button
        variant="contained"
        color="success"
        startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <GroupsIcon />}
        onClick={handleSendToAllProfessors}
        disabled={sending || horarios.length === 0 || professoresComCelular.length === 0}
        size="small"
      >
        {sending ? 'Enviando...' : `Enviar para Todos (${professoresComCelular.length})`}
      </Button>
    );
  }

  // Modo: Enviar para professor individual
  if (!professor) return null;

  // Verificar se professor tem celular
  if (!professor.celular) {
    return (
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<WhatsAppIcon />}
        disabled
        size="small"
      >
        Sem celular
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="contained"
        color="success"
        startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
        endIcon={<ArrowIcon />}
        onClick={handleClick}
        disabled={sending || horarios.length === 0}
        size="small"
      >
        {sending ? 'Enviando...' : 'Enviar WhatsApp'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleSendToday}>
          <ListItemIcon>
            <TodayIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Horario de Hoje" secondary={DiasSemanaNomes[getCurrentDayOfWeek()]} />
        </MenuItem>

        <MenuItem onClick={handleSendWeek}>
          <ListItemIcon>
            <WeekIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Semana Completa" secondary="Segunda a Sexta" />
        </MenuItem>

        <Divider />

        <MenuItem disabled sx={{ opacity: 0.7 }}>
          <ListItemText primary="Dia especifico:" />
        </MenuItem>

        {([1, 2, 3, 4, 5] as DiaSemana[]).map((dia) => (
          <MenuItem key={dia} onClick={() => handleSendDay(dia)}>
            <ListItemText primary={DiasSemanaNomes[dia]} sx={{ pl: 4 }} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
