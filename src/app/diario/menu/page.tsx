'use client';

/**
 * Pagina inicial do Luminar.
 */

import { Box, Typography, Grid } from '@mui/material';
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
        />

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
