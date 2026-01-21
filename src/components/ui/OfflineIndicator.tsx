'use client';

/**
 * Indicador de status offline que aparece quando nao ha conexao.
 * Mostra banner no topo da tela com opcao de retry.
 */

import { useState, useEffect } from 'react';
import { Box, Slide, Typography, Button, IconButton, useTheme } from '@mui/material';
import {
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useOffline } from '@/hooks/useOffline';

interface OfflineIndicatorProps {
  showRetryButton?: boolean;
  onRetry?: () => void;
  dismissable?: boolean;
  position?: 'top' | 'bottom';
}

export default function OfflineIndicator({
  showRetryButton = true,
  onRetry,
  dismissable = true,
  position = 'top',
}: OfflineIndicatorProps) {
  const theme = useTheme();
  const { isOffline, wasOffline, isOnline } = useOffline();
  const [dismissed, setDismissed] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  // Mostrar mensagem de reconexao
  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnected(true);
      setDismissed(false);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline]);

  // Resetar dismissed quando ficar offline novamente
  useEffect(() => {
    if (isOffline) {
      setDismissed(false);
    }
  }, [isOffline]);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const show = (isOffline || showReconnected) && !dismissed;

  const positionStyles = position === 'top'
    ? { top: 64, bottom: 'auto' }
    : { bottom: 0, top: 'auto' };

  return (
    <Slide direction={position === 'top' ? 'down' : 'up'} in={show} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          ...positionStyles,
          zIndex: theme.zIndex.snackbar,
          bgcolor: isOffline ? 'error.main' : 'success.main',
          color: 'white',
          py: 1,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          boxShadow: theme.shadows[4],
        }}
      >
        {isOffline ? (
          <>
            <WifiOffIcon fontSize="small" />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              Sem conexão com a internet
            </Typography>
            {showRetryButton && (
              <Button
                size="small"
                color="inherit"
                startIcon={<RefreshIcon />}
                onClick={handleRetry}
                sx={{ minWidth: 'auto' }}
              >
                Tentar novamente
              </Button>
            )}
          </>
        ) : (
          <Typography variant="body2">
            Conexão restabelecida
          </Typography>
        )}
        {dismissable && (
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setDismissed(true)}
            sx={{ ml: 1 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Slide>
  );
}
