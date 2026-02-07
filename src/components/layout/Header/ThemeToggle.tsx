/**
 * Botao de alternancia de tema.
 */

import { IconButton, Tooltip, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
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
        size="small"
        aria-label={isDark ? 'ativar modo claro' : 'ativar modo escuro'}
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
        {isDark
          ? <LightMode sx={{ fontSize: 18 }} />
          : <DarkMode sx={{ fontSize: 18 }} />}
      </IconButton>
    </Tooltip>
  );
}
