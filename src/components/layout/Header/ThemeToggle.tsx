/**
 * Botao de alternancia de tema.
 */

import { IconButton, Tooltip, useTheme } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useUIStore } from '@/store/uiStore';

export function ThemeToggle() {
  const theme = useTheme();
  const { toggleTheme } = useUIStore();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Modo claro' : 'Modo escuro'}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        size="small"
        aria-label={isDark ? 'ativar modo claro' : 'ativar modo escuro'}
      >
        {isDark ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
}
