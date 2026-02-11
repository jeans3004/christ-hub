'use client';

/**
 * Pagina inicial do Luminar.
 */

import { Box, Typography, Grid, Chip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  CheckCircleOutline,
  GradeOutlined,
  EventNote,
  CalendarMonth,
  People,
  TrendingUp,
  AssignmentTurnedIn,
  Schedule,
  AccessTime,
  MedicalServices,
} from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { HeroCard, StatCard } from '@/components/ui';
import { QuickAccessCard, EmptyAnnouncements } from './components';
import { Turno } from '@/types';
import { calcularTempo } from '../chamada/hooks/useChamadaData';

// Quick access para administradores
const adminQuickAccessItems = [
  { title: 'Atrasos', icon: <AccessTime sx={{ fontSize: 28 }} />, href: '/diario/atrasos', color: '#EF4444' },
  { title: 'Atestados', icon: <MedicalServices sx={{ fontSize: 28 }} />, href: '/diario/atestados', color: '#8B5CF6' },
  { title: 'Chamada', icon: <CheckCircleOutline sx={{ fontSize: 28 }} />, href: '/diario/chamada', color: '#22C55E' },
  { title: 'Notas', icon: <GradeOutlined sx={{ fontSize: 28 }} />, href: '/diario/notas', color: '#3B82F6' },
];

// Quick access para professores e coordenadores
const defaultQuickAccessItems = [
  { title: 'Chamada', icon: <CheckCircleOutline sx={{ fontSize: 28 }} />, href: '/diario/chamada', color: '#22C55E' },
  { title: 'Notas', icon: <GradeOutlined sx={{ fontSize: 28 }} />, href: '/diario/notas', color: '#3B82F6' },
  { title: 'Agenda', icon: <EventNote sx={{ fontSize: 28 }} />, href: '/diario/agenda', color: '#F59E0B' },
  { title: 'Calendario', icon: <CalendarMonth sx={{ fontSize: 28 }} />, href: '/diario/agenda', color: '#8B5CF6' },
];

const statsItems = [
  { icon: <People />, iconColor: '#3B82F6', label: 'Alunos', value: '--' },
  { icon: <TrendingUp />, iconColor: '#22C55E', label: 'Frequencia', value: '--' },
  { icon: <AssignmentTurnedIn />, iconColor: '#F59E0B', label: 'Atividades', value: '--' },
  { icon: <Schedule />, iconColor: '#8B5CF6', label: 'Aulas Hoje', value: '--' },
];

const HORARIOS_MANHA = ['7:00', '7:45', '8:30', '9:15', '10:00', '10:45', '11:30'];
const HORARIOS_TARDE = ['13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30'];
const HORARIOS_SEXTA_TARDE = ['13:00', '13:35', '14:10', '14:45', '15:20', '15:55', '16:30'];

function detectarTurno(): Turno | undefined {
  const h = new Date().getHours();
  if (h >= 7 && h < 12) return 'Matutino';
  if (h >= 13 && h < 18) return 'Vespertino';
  return undefined;
}

function getHorarioLabel(tempo: number, turno?: Turno): string {
  const idx = tempo - 1;
  const isSexta = new Date().getDay() === 5;
  if (turno === 'Matutino') return HORARIOS_MANHA[idx] || '';
  if (turno === 'Vespertino') return (isSexta ? HORARIOS_SEXTA_TARDE : HORARIOS_TARDE)[idx] || '';
  return '';
}

function TempoAtualBanner() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const turno = detectarTurno();
  const tempo = calcularTempo(turno);
  const horario = getHorarioLabel(tempo, turno);

  // Fora do horario de aula
  if (!turno) {
    return (
      <Box
        sx={{
          mt: 2.5,
          py: 2,
          px: 2.5,
          borderRadius: 2,
          bgcolor: isDark ? alpha('#8B949E', 0.08) : alpha('#64748B', 0.06),
          border: '1px solid',
          borderColor: isDark ? alpha('#8B949E', 0.15) : alpha('#64748B', 0.12),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
        }}
      >
        <Schedule sx={{ fontSize: 22, color: 'text.secondary', opacity: 0.7 }} />
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Fora do horario de aula
        </Typography>
      </Box>
    );
  }

  const turnoLabel = turno === 'Matutino' ? 'Manha' : 'Tarde';

  return (
    <Box
      sx={{
        mt: 2.5,
        py: 2,
        px: 2.5,
        borderRadius: 2,
        bgcolor: isDark ? alpha('#3B82F6', 0.08) : alpha('#2A3F5F', 0.04),
        border: '1px solid',
        borderColor: isDark ? alpha('#3B82F6', 0.18) : alpha('#2A3F5F', 0.10),
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 2, sm: 3 },
      }}
    >
      {/* Numero hero */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 64,
          height: 64,
          borderRadius: 2,
          bgcolor: isDark ? alpha('#3B82F6', 0.12) : alpha('#2A3F5F', 0.07),
          border: '1px solid',
          borderColor: isDark ? alpha('#3B82F6', 0.2) : alpha('#2A3F5F', 0.10),
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: '2rem',
            fontWeight: 700,
            lineHeight: 1,
            color: 'primary.main',
          }}
        >
          {tempo}º
        </Typography>
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: '0.6rem',
          }}
        >
          Tempo atual
        </Typography>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: '1.1rem',
            color: 'text.primary',
            lineHeight: 1.3,
          }}
        >
          {tempo}º Tempo
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          {horario && (
            <Chip
              icon={<Schedule sx={{ fontSize: 13 }} />}
              label={horario}
              size="small"
              variant="outlined"
              sx={{
                fontWeight: 500,
                fontSize: '0.7rem',
                height: 24,
                borderColor: 'divider',
                '& .MuiChip-icon': { color: 'text.secondary' },
              }}
            />
          )}
          <Chip
            label={turnoLabel}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 24,
              bgcolor: isDark ? alpha('#E5A53A', 0.15) : alpha('#E5A53A', 0.12),
              color: isDark ? '#E5A53A' : '#9A6F1E',
              border: 'none',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: 'text.secondary',
        mb: 1.5,
        display: 'block',
      }}
    >
      {children}
    </Typography>
  );
}

export default function MenuPage() {
  const { usuario } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Administradores e coordenadores veem Atrasos, Atestados, Chamada, Notas
  const quickAccessItems = (usuario?.tipo === 'administrador' || usuario?.tipo === 'coordenador')
    ? adminQuickAccessItems
    : defaultQuickAccessItems;

  return (
    <MainLayout title="Luminar">
      <Box
        sx={{
          maxWidth: 1100,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
        }}
      >
        {/* Hero Card */}
        <HeroCard
          userName={usuario?.nome || 'Usuario'}
          userRole={usuario?.email || 'usuario@email.com'}
          sx={{ mb: 3 }}
        >
          <TempoAtualBanner />
        </HeroCard>

        {/* Stats Grid */}
        <Box sx={{ mb: 4 }}>
          <SectionLabel>Resumo</SectionLabel>
          <Grid container spacing={2}>
            {statsItems.map((item) => (
              <Grid size={{ xs: 6, sm: 3 }} key={item.label}>
                <StatCard {...item} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Quick Access */}
        <Box sx={{ mb: 4 }}>
          <SectionLabel>Acesso rapido</SectionLabel>
          <Grid container spacing={2}>
            {quickAccessItems.map((item) => (
              <Grid size={{ xs: 6, sm: 3 }} key={item.title}>
                <QuickAccessCard {...item} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Posts Section */}
        <Box>
          <SectionLabel>Comunicados</SectionLabel>
          <EmptyAnnouncements />
        </Box>
      </Box>
    </MainLayout>
  );
}
