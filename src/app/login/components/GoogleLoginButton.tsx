'use client';

/**
 * Botao de login com Google.
 */

import { Button, CircularProgress } from '@mui/material';
import { Google } from '@mui/icons-material';

interface GoogleLoginButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}

export function GoogleLoginButton({ onClick, loading, disabled }: GoogleLoginButtonProps) {
  return (
    <Button
      variant="outlined"
      size="large"
      fullWidth
      onClick={onClick}
      disabled={disabled}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Google />}
      sx={{
        py: 1.5,
        fontSize: '1rem',
        textTransform: 'none',
        borderColor: 'divider',
        color: 'text.primary',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover',
        },
      }}
    >
      {loading ? 'Entrando...' : 'Entrar com Google'}
    </Button>
  );
}
