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
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Today as TodayIcon,
  DateRange as WeekIcon,
  ArrowDropDown as ArrowIcon,
} from '@mui/icons-material';
import { HorarioAula, Turma, Disciplina, Usuario, DiaSemana, DiasSemanaNomes } from '@/types';

interface WhatsAppSendButtonProps {
  professor: Usuario;
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
  sending: boolean;
}

// Obter o dia da semana atual (0-6)
function getCurrentDayOfWeek(): DiaSemana {
  return new Date().getDay() as DiaSemana;
}

export function WhatsAppSendButton({
  professor,
  horarios,
  turmas,
  disciplinas,
  onSend,
  sending,
}: WhatsAppSendButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSendToday = async () => {
    handleClose();
    await onSend(professor, horarios, turmas, disciplinas, getCurrentDayOfWeek());
  };

  const handleSendWeek = async () => {
    handleClose();
    await onSend(professor, horarios, turmas, disciplinas);
  };

  const handleSendDay = async (dia: DiaSemana) => {
    handleClose();
    await onSend(professor, horarios, turmas, disciplinas, dia);
  };

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

        <MenuItem divider disabled sx={{ opacity: 0.7 }}>
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
