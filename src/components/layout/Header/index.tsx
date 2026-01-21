'use client';

/**
 * Header principal do sistema.
 */

import { AppBar, Toolbar, Box, IconButton, Typography, useTheme, useMediaQuery, Tooltip } from '@mui/material';
import { Menu as MenuIcon, MenuOpen as MenuOpenIcon } from '@mui/icons-material';
import { useUIStore } from '@/store/uiStore';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { HeaderActions } from './HeaderActions';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  title?: string;
  showMenuButton?: boolean;
}

export default function Header({ title, showMenuButton = true }: HeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { setSidebarOpen, toggleSidebarMode, sidebarMode, addToast } = useUIStore();

  const handleMenuClick = () => {
    if (isMobile) {
      setSidebarOpen(true);
    } else {
      toggleSidebarMode();
    }
  };

  const handleHelp = () => {
    addToast('Central de ajuda em desenvolvimento', 'info');
  };

  const handleNotifications = () => {
    addToast('Notificações em desenvolvimento', 'info');
  };

  const handleApps = () => {
    addToast('Menu de apps em desenvolvimento', 'info');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        bgcolor: 'header.background',
        color: 'header.text',
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

        {/* Title */}
        {title && (
          <Typography
            variant="body1"
            component="h1"
            sx={{
              ml: 2,
              fontWeight: 500,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {title}
          </Typography>
        )}

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ThemeToggle />
          <HeaderActions
            onHelpClick={handleHelp}
            onNotificationsClick={handleNotifications}
            onAppsClick={handleApps}
          />
          <UserMenu />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export { Logo } from './Logo';
export { ThemeToggle } from './ThemeToggle';
export { HeaderActions } from './HeaderActions';
export { UserMenu } from './UserMenu';
