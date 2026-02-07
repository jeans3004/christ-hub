'use client';

/**
 * Header principal do sistema.
 */

import { AppBar, Toolbar, Box, IconButton, useTheme, useMediaQuery, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Menu as MenuIcon, MenuOpen as MenuOpenIcon } from '@mui/icons-material';
import { useUIStore } from '@/store/uiStore';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  showMenuButton?: boolean;
}

export default function Header({ showMenuButton = true }: HeaderProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { setSidebarOpen, toggleSidebarMode, sidebarMode } = useUIStore();

  const handleMenuClick = () => {
    if (isMobile) {
      setSidebarOpen(true);
    } else {
      toggleSidebarMode();
    }
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        bgcolor: isDark ? '#0D1117' : '#FFFFFF',
        color: isDark ? '#F0F6FC' : '#111827',
        borderBottom: '1px solid',
        borderColor: isDark ? alpha('#FFFFFF', 0.08) : '#F0F0F0',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Toolbar
        sx={{
          gap: 1.5,
          minHeight: { xs: 56, sm: 60 },
          px: { xs: 1.5, sm: 2 },
        }}
      >
        {showMenuButton && (
          <Tooltip title={isMobile ? 'Abrir menu' : (sidebarMode === 'expanded' ? 'Recolher menu' : 'Expandir menu')}>
            <IconButton
              edge="start"
              onClick={handleMenuClick}
              aria-label={isMobile ? 'abrir menu' : 'alternar menu'}
              sx={{
                color: 'text.secondary',
                borderRadius: '10px',
                width: 36,
                height: 36,
                '&:hover': {
                  bgcolor: isDark ? alpha('#FFFFFF', 0.06) : alpha('#000000', 0.04),
                  color: 'text.primary',
                },
              }}
            >
              {!isMobile && sidebarMode === 'expanded'
                ? <MenuOpenIcon sx={{ fontSize: 20 }} />
                : <MenuIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
        )}

        <Logo />

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ThemeToggle />
          <UserMenu />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export { Logo } from './Logo';
export { ThemeToggle } from './ThemeToggle';
export { UserMenu } from './UserMenu';
