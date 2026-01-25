/**
 * Aba de frequencia do aluno.
 */

import {
  Box,
  Typography,
  Grid,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  EventAvailable,
  EventBusy,
  TrendingUp,
  CalendarMonth,
} from '@mui/icons-material';
import { FrequenciaResumo } from '../types';

interface TabPanelFrequenciaProps {
  frequencia: FrequenciaResumo;
}

export function TabPanelFrequencia({ frequencia }: TabPanelFrequenciaProps) {
  const getProgressColor = (percentual: number) => {
    if (percentual >= 75) return 'success';
    if (percentual >= 50) return 'warning';
    return 'error';
  };

  const getStatusText = (percentual: number) => {
    if (percentual >= 75) return 'Frequencia adequada';
    if (percentual >= 50) return 'Frequencia em atencao';
    return 'Frequencia critica';
  };

  const StatCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color?: string;
  }) => (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: color ? `${color}.light` : 'action.hover',
          color: color ? `${color}.main` : 'text.primary',
          display: 'flex',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={600}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );

  if (frequencia.totalAulas === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          minHeight: 200,
        }}
      >
        <CalendarMonth sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Sem dados de frequencia
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Ainda nao ha registros de chamada para este aluno
        </Typography>
      </Box>
    );
  }

  const progressColor = getProgressColor(frequencia.percentualPresenca);
  const statusText = getStatusText(frequencia.percentualPresenca);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Percentual de Presenca
          </Typography>
          <Typography
            variant="h4"
            fontWeight={700}
            color={`${progressColor}.main`}
          >
            {frequencia.percentualPresenca}%
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={frequencia.percentualPresenca}
          color={progressColor}
          sx={{
            height: 12,
            borderRadius: 1,
            mb: 1,
          }}
        />

        <Typography
          variant="body2"
          color={`${progressColor}.main`}
          fontWeight={500}
        >
          {statusText}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<CalendarMonth />}
            label="Total de Aulas"
            value={frequencia.totalAulas}
            color="primary"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<EventAvailable />}
            label="Presencas"
            value={frequencia.presencas}
            color="success"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<EventBusy />}
            label="Faltas"
            value={frequencia.faltas}
            color="error"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<TrendingUp />}
            label="Frequencia"
            value={`${frequencia.percentualPresenca}%`}
            color={progressColor}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Informacoes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          A frequencia minima exigida por lei e de 75% do total de aulas.
          Alunos com frequencia inferior podem ficar em situacao de
          infrequencia escolar.
        </Typography>
      </Box>
    </Box>
  );
}
