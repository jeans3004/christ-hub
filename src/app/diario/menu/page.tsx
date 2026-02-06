'use client';

/**
 * Pagina inicial do Luminar.
 */

import { Box, Typography, Grid } from '@mui/material';
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
import { HeroCard, StatCard, PageBackground } from '@/components/ui';
import { QuickAccessCard, EmptyAnnouncements } from './components';

// Quick access para administradores
const adminQuickAccessItems = [
  { title: 'Atrasos', icon: <AccessTime sx={{ fontSize: 28 }} />, href: '/diario/atrasos' },
  { title: 'Atestados', icon: <MedicalServices sx={{ fontSize: 28 }} />, href: '/diario/atestados' },
  { title: 'Chamada', icon: <CheckCircleOutline sx={{ fontSize: 28 }} />, href: '/diario/chamada' },
  { title: 'Notas', icon: <GradeOutlined sx={{ fontSize: 28 }} />, href: '/diario/notas' },
];

// Quick access para professores e coordenadores
const defaultQuickAccessItems = [
  { title: 'Chamada', icon: <CheckCircleOutline sx={{ fontSize: 28 }} />, href: '/diario/chamada' },
  { title: 'Notas', icon: <GradeOutlined sx={{ fontSize: 28 }} />, href: '/diario/notas' },
  { title: 'Agenda', icon: <EventNote sx={{ fontSize: 28 }} />, href: '/diario/agenda' },
  { title: 'Calendario', icon: <CalendarMonth sx={{ fontSize: 28 }} />, href: '/diario/agenda' },
];

const statsItems = [
  { icon: <People />, iconColor: '#3B82F6', iconBgColor: '#DBEAFE', label: 'Alunos', value: '--' },
  { icon: <TrendingUp />, iconColor: '#22C55E', iconBgColor: '#D1FAE5', label: 'Frequencia', value: '--' },
  { icon: <AssignmentTurnedIn />, iconColor: '#F59E0B', iconBgColor: '#FEF3C7', label: 'Atividades', value: '--' },
  { icon: <Schedule />, iconColor: '#8B5CF6', iconBgColor: '#EDE9FE', label: 'Aulas Hoje', value: '--' },
];

export default function MenuPage() {
  const { usuario } = useAuth();

  // Administradores e coordenadores veem Atrasos, Atestados, Chamada, Notas
  const quickAccessItems = (usuario?.tipo === 'administrador' || usuario?.tipo === 'coordenador')
    ? adminQuickAccessItems
    : defaultQuickAccessItems;

  return (
    <MainLayout title="Luminar">
      <PageBackground>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 } }}>
          {/* Hero Card */}
          <HeroCard
            userName={usuario?.nome || 'Usuario'}
            userRole={usuario?.email || 'usuario@email.com'}
            sx={{ mb: 3 }}
          />

          {/* Stats Grid */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {statsItems.map((item) => (
              <Grid size={{ xs: 6, sm: 3 }} key={item.label}>
                <StatCard {...item} />
              </Grid>
            ))}
          </Grid>

          {/* Quick Access */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
              Mais acessados
            </Typography>
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
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
              Comunicados
            </Typography>
            <EmptyAnnouncements />
          </Box>
        </Box>
      </PageBackground>
    </MainLayout>
  );
}
