'use client';

/**
 * Pagina inicial do Luminar.
 */

import { Box, Typography, Grid } from '@mui/material';
import { CheckCircleOutline, GradeOutlined, EventNote, CalendarMonth } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { QuickAccessCard, PromoBanner, EmptyAnnouncements } from './components';

const quickAccessItems = [
  { title: 'Chamada', icon: <CheckCircleOutline sx={{ fontSize: 28 }} />, href: '/diario/chamada' },
  { title: 'Notas', icon: <GradeOutlined sx={{ fontSize: 28 }} />, href: '/diario/notas' },
  { title: 'Agenda', icon: <EventNote sx={{ fontSize: 28 }} />, href: '/diario/agenda' },
  { title: 'Calendario', icon: <CalendarMonth sx={{ fontSize: 28 }} />, href: '/diario/agenda' },
];

export default function MenuPage() {
  const { usuario } = useAuth();

  return (
    <MainLayout title="Luminar">
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Greeting */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Ola, {usuario?.nome || 'Usuario'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {usuario?.email || 'usuario@email.com'}
          </Typography>
        </Box>

        {/* Quick Access + Banner */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'text.secondary' }}>
              Mais acessados
            </Typography>
            <Grid container spacing={2}>
              {quickAccessItems.map((item) => (
                <Grid size={{ xs: 6, sm: 3 }} key={item.title}>
                  <QuickAccessCard {...item} />
                </Grid>
              ))}
            </Grid>
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Box sx={{ height: '100%', pt: { xs: 0, lg: 3.5 } }}>
              <PromoBanner />
            </Box>
          </Grid>
        </Grid>

        {/* Posts Section */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'text.secondary' }}>
            Comunicados
          </Typography>
          <EmptyAnnouncements />
        </Box>
      </Box>
    </MainLayout>
  );
}
