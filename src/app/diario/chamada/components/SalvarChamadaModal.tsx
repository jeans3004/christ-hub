/**
 * Modal para escolher salvar 1 ou 2 tempos consecutivos.
 * Professor pode ajustar o tempo inicial (ex: registrar no final da aula dupla).
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Schedule } from '@mui/icons-material';
import { Turno } from '@/types';
import { calcularTempo } from '../hooks/useChamadaData';

const HORARIOS_MANHA = ['7:00', '7:45', '8:30', '9:15', '10:00', '10:45', '11:30'];
const HORARIOS_TARDE = ['13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30'];
const HORARIOS_SEXTA_TARDE = ['13:00', '13:35', '14:10', '14:45', '15:20', '15:55', '16:30'];

function getHorarioLabel(tempo: number, turno?: Turno): string {
  const idx = tempo - 1;
  const isSexta = new Date().getDay() === 5;

  if (turno === 'Matutino') return HORARIOS_MANHA[idx] || '';
  if (turno === 'Vespertino') return (isSexta ? HORARIOS_SEXTA_TARDE : HORARIOS_TARDE)[idx] || '';
  return '';
}

interface SalvarChamadaModalProps {
  open: boolean;
  turno?: Turno;
  saving: boolean;
  onClose: () => void;
  onConfirm: (quantidade: number, tempoInicial: number) => void;
}

export function SalvarChamadaModal({ open, turno, saving, onClose, onConfirm }: SalvarChamadaModalProps) {
  const tempoDetectado = calcularTempo(turno);
  const [tempoSelecionado, setTempoSelecionado] = useState(tempoDetectado);

  // Reset tempo selecionado quando modal abre
  useEffect(() => {
    if (open) setTempoSelecionado(calcularTempo(turno));
  }, [open, turno]);

  const horarioSelecionado = getHorarioLabel(tempoSelecionado, turno);
  const horarioProximo = tempoSelecionado < 7 ? getHorarioLabel(tempoSelecionado + 1, turno) : '';
  const podeDoisTempos = tempoSelecionado < 7;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Registrar Chamada</DialogTitle>
      <DialogContent>
        {/* Tempo - hero display */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
            py: 2,
            px: 2,
            mb: 2,
            borderRadius: 2,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(59, 130, 246, 0.08)'
                : 'rgba(42, 63, 95, 0.04)',
            border: '1px solid',
            borderColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(59, 130, 246, 0.15)'
                : 'rgba(42, 63, 95, 0.10)',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              fontWeight: 600,
              color: 'text.secondary',
              fontSize: '0.65rem',
            }}
          >
            Tempo selecionado
          </Typography>
          <Typography
            sx={{
              fontSize: '2.5rem',
              fontWeight: 700,
              lineHeight: 1,
              color: 'primary.main',
            }}
          >
            {tempoSelecionado}º
          </Typography>
          {horarioSelecionado && (
            <Chip
              icon={<Schedule sx={{ fontSize: 14 }} />}
              label={horarioSelecionado}
              size="small"
              variant="outlined"
              sx={{
                mt: 0.5,
                fontWeight: 500,
                fontSize: '0.75rem',
                height: 26,
                borderColor: 'divider',
                '& .MuiChip-icon': { color: 'text.secondary' },
              }}
            />
          )}
        </Box>

        {/* Seletor de tempo */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Alterar tempo inicial:
          </Typography>
          <ToggleButtonGroup
            value={tempoSelecionado}
            exclusive
            onChange={(_, val) => { if (val !== null) setTempoSelecionado(val); }}
            size="small"
            fullWidth
            sx={{
              '& .MuiToggleButton-root': {
                fontWeight: 600,
                fontSize: '0.85rem',
                py: 0.75,
              },
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((t) => (
              <ToggleButton key={t} value={t}>
                {t}º
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Opcoes de quantidade */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => onConfirm(1, tempoSelecionado)}
            disabled={saving}
            sx={{ py: 1.5, justifyContent: 'flex-start', textTransform: 'none' }}
          >
            {saving ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            1 Tempo ({tempoSelecionado}º{horarioSelecionado ? ` - ${horarioSelecionado}` : ''})
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => onConfirm(2, tempoSelecionado)}
            disabled={saving || !podeDoisTempos}
            sx={{ py: 1.5, justifyContent: 'flex-start', textTransform: 'none' }}
          >
            {saving ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            2 Tempos consecutivos ({tempoSelecionado}º e {tempoSelecionado + 1}º{horarioProximo ? ` - ${horarioSelecionado} e ${horarioProximo}` : ''})
          </Button>
          {!podeDoisTempos && (
            <Typography variant="caption" color="text.secondary">
              Nao e possivel registrar 2 tempos no ultimo horario.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
