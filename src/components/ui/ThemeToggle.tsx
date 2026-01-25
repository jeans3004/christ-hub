'use client';

import { IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { DarkMode, LightMode, SettingsBrightness, Check } from '@mui/icons-material';
import { useState } from 'react';
import { useUIStore } from '@/store/uiStore';

export function ThemeToggle() {
  const { themeMode, setThemeMode } = useUIStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    handleClose();
  };

  const getIcon = () => {
    switch (themeMode) {
      case 'light': return <LightMode />;
      case 'dark': return <DarkMode />;
      default: return <SettingsBrightness />;
    }
  };

  return (
    <>
      <Tooltip title="Tema">
        <IconButton onClick={handleClick} sx={{ color: 'text.secondary' }}>
          {getIcon()}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleSelect('light')}>
          <ListItemIcon><LightMode fontSize="small" /></ListItemIcon>
          <ListItemText>Claro</ListItemText>
          {themeMode === 'light' && <Check fontSize="small" sx={{ ml: 1 }} />}
        </MenuItem>
        <MenuItem onClick={() => handleSelect('dark')}>
          <ListItemIcon><DarkMode fontSize="small" /></ListItemIcon>
          <ListItemText>Escuro</ListItemText>
          {themeMode === 'dark' && <Check fontSize="small" sx={{ ml: 1 }} />}
        </MenuItem>
        <MenuItem onClick={() => handleSelect('system')}>
          <ListItemIcon><SettingsBrightness fontSize="small" /></ListItemIcon>
          <ListItemText>Sistema</ListItemText>
          {themeMode === 'system' && <Check fontSize="small" sx={{ ml: 1 }} />}
        </MenuItem>
      </Menu>
    </>
  );
}
