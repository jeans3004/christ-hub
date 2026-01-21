'use client';

import { Box, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { useUIStore } from '@/store/uiStore';
import { DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from '@/constants/navigation';

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
  const sidebarMode = useUIStore((state) => state.sidebarMode);

  // Calcula margem dinamica baseada no modo do sidebar
  const getContentMargin = () => {
    if (!showSidebar) return 0;
    if (isMobile) return 0;
    switch (sidebarMode) {
      case 'expanded':
        return DRAWER_WIDTH;
      case 'collapsed':
        return DRAWER_WIDTH_COLLAPSED;
      case 'hidden':
        return 0;
      default:
        return DRAWER_WIDTH;
    }
  };

  const contentMargin = getContentMargin();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header title={title} showMenuButton={showSidebar} />

      {showSidebar && <Sidebar />}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 0.5, sm: 0.5, md: 1 },
          pb: { xs: 1, sm: 1, md: 1.5 },
          pl: 0,
          pr: { xs: 0.5, sm: 1, md: 1.5 },
          width: showSidebar && !isMobile
            ? `calc(100% - ${contentMargin}px)`
            : '100%',
          ml: showSidebar && !isMobile
            ? `${contentMargin}px`
            : 0,
          bgcolor: 'background.default',
          minHeight: '100vh',
          transition: theme.transitions.create(['margin', 'width'], {
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
