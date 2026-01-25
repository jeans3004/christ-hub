'use client';

/**
 * Header principal do sistema.
 */

import { AppBar, Toolbar, Box, IconButton, useTheme, useMediaQuery, Tooltip } from '@mui/material';
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
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        {/* Menu Button (Mobile e Desktop) */}
        {showMenuButton && (
          <Tooltip title={isMobile ? 'Abrir menu' : (sidebarMode === 'expanded' ? 'Recolher menu' : 'Expandir menu')}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleMenuClick}
              aria-label={isMobile ? 'abrir menu' : 'alternar menu'}
            >
              {!isMobile && sidebarMode === 'expanded' ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Logo */}
        <Logo />

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Actions */}
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
