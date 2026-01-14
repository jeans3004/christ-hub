'use client';

import { Box, Typography, Card, CardActionArea, Grid, Paper, Button } from '@mui/material';
import {
  CheckCircleOutline,
  GradeOutlined,
  EventNote,
  CalendarMonth,
} from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Quick access card component
interface QuickAccessCardProps {
  title: string;
  icon: React.ReactNode;
  href: string;
}

function QuickAccessCard({ title, icon, href }: QuickAccessCardProps) {
  const router = useRouter();

  return (
    <Card
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        transition: 'all 150ms ease',
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: 1,
        },
      }}
    >
      <CardActionArea
        onClick={() => router.push(href)}
        sx={{
          p: 2.5,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        }}
      >
        <Box
          sx={{
            color: 'primary.main',
            mb: 1.5,
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: 'text.primary',
            lineHeight: 1.4,
          }}
        >
          {title}
        </Typography>
      </CardActionArea>
    </Card>
  );
}

// Banner/Carousel component
function PromoBanner() {
  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        minHeight: 200,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 50%, #06B6D4 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            lineHeight: 1.2,
            mb: 1.5,
          }}
        >
          Voce conhece a rotina da escola como ninguem
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
          Participe da pesquisa e compartilhe como sua escola organiza processos e ferramentas administrativas.
        </Typography>
        <Button
          variant="contained"
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.9)',
            },
          }}
        >
          Quero participar
        </Button>
      </Box>

      {/* Decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          right: -20,
          bottom: -20,
          width: 200,
          height: 200,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.1)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: 60,
          top: 20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.1)',
        }}
      />
    </Paper>
  );
}

export default function MenuPage() {
  const { usuario } = useAuth();

  const quickAccessItems = [
    {
      title: 'Chamada',
      icon: <CheckCircleOutline sx={{ fontSize: 28 }} />,
      href: '/diario/chamada',
    },
    {
      title: 'Notas',
      icon: <GradeOutlined sx={{ fontSize: 28 }} />,
      href: '/diario/notas',
    },
    {
      title: 'Agenda',
      icon: <EventNote sx={{ fontSize: 28 }} />,
      href: '/diario/agenda',
    },
    {
      title: 'Calendario',
      icon: <CalendarMonth sx={{ fontSize: 28 }} />,
      href: '/diario/calendario',
    },
  ];

  return (
    <MainLayout title="Diario Digital">
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

        {/* Posts Section - Coordinator/Admin Announcements */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'text.secondary' }}>
            Comunicados
          </Typography>
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Nenhum comunicado no momento
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Os comunicados de coordenadores e administradores aparecerao aqui.
            </Typography>
          </Paper>
        </Box>
      </Box>
    </MainLayout>
  );
}
