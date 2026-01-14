'use client';

import { Box, Toolbar } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 260;

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
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header title={title} showMenuButton={showSidebar} />

      {showSidebar && <Sidebar />}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: showSidebar ? { md: `calc(100% - ${DRAWER_WIDTH}px)` } : '100%',
          ml: showSidebar ? { md: `${DRAWER_WIDTH}px` } : 0,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
