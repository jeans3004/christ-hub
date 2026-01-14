'use client';

/**
 * Header principal do sistema.
 */

import { AppBar, Toolbar, Box, IconButton, Typography, useTheme } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
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
  const { setSidebarOpen, addToast } = useUIStore();

  const handleMenuClick = () => {
    setSidebarOpen(true);
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
        {/* Menu Button (Mobile) */}
        {showMenuButton && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleMenuClick}
            sx={{ display: { md: 'none' } }}
            aria-label="abrir menu"
          >
            <MenuIcon />
          </IconButton>
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
