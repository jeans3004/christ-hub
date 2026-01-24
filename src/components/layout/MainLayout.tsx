'use client';

import { Box, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
}

export default function MainLayout({
  children,
  title,
  showSidebar = true,
}: MainLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header showMenuButton={showSidebar} />

      {showSidebar && <Sidebar />}

      {/*
        Main content: flexGrow: 1 faz ocupar o espaço restante após o Drawer.
        Drawer variant="permanent" é docked e participa do flex, então
        NÃO precisa de margin-left (flexbox posiciona automaticamente).
      */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 0.5, sm: 0.5, md: 1 },
          pb: { xs: 1, sm: 1, md: 1.5 },
          pl: { xs: 0.5, sm: 1, md: 1.5 },
          pr: { xs: 0.5, sm: 1, md: 1.5 },
          bgcolor: 'background.default',
          minHeight: '100vh',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
