'use client';

/**
 * Indicador de status da conexao WhatsApp.
 */

import { useState } from 'react';
import {
  Box,
  Chip,
  Typography,
  Avatar,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Refresh,
  QrCode,
  Phone,
} from '@mui/icons-material';
import { WhatsAppStatus } from '../types';

interface StatusIndicatorProps {
  status: WhatsAppStatus;
  onRefresh?: () => void;
  compact?: boolean;
}

export function StatusIndicator({
  status,
  onRefresh,
  compact = false,
}: StatusIndicatorProps) {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // Buscar QR Code
  const fetchQrCode = async () => {
    setLoadingQr(true);
    try {
      const response = await fetch('/api/whatsapp/qrcode');
      const data = await response.json();

      if (data.connected) {
        // Já está conectado
        onRefresh?.();
        setQrModalOpen(false);
      } else if (data.qrcode) {
        setQrCode(data.qrcode);
      }
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error);
    } finally {
      setLoadingQr(false);
    }
  };

  // Abrir modal QR
  const handleOpenQrModal = () => {
    setQrModalOpen(true);
    fetchQrCode();
  };

  // Versão compacta (para header)
  if (compact) {
    return (
      <Tooltip title={status.connected ? `Conectado: ${status.phoneNumber || 'WhatsApp'}` : 'WhatsApp desconectado'}>
        <Chip
          icon={
            status.loading ? (
              <CircularProgress size={14} />
            ) : status.connected ? (
              <CheckCircle fontSize="small" />
            ) : (
              <Error fontSize="small" />
            )
          }
          label={status.connected ? 'Online' : 'Offline'}
          size="small"
          color={status.connected ? 'success' : 'error'}
          onClick={status.connected ? undefined : handleOpenQrModal}
          sx={{ cursor: status.connected ? 'default' : 'pointer' }}
        />
      </Tooltip>
    );
  }

  // Versão completa (para pagina)
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderRadius: 2,
          bgcolor: status.connected ? 'success.50' : 'error.50',
          border: '1px solid',
          borderColor: status.connected ? 'success.200' : 'error.200',
        }}
      >
        {status.loading ? (
          <CircularProgress size={40} />
        ) : (
          <Avatar
            src={status.profilePicUrl}
            sx={{
              bgcolor: status.connected ? 'success.main' : 'error.main',
              width: 48,
              height: 48,
            }}
          >
            {status.connected ? <Phone /> : <Error />}
          </Avatar>
        )}

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {status.loading
              ? 'Verificando conexao...'
              : status.connected
                ? status.profileName || 'WhatsApp Conectado'
                : 'WhatsApp Desconectado'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {status.loading
              ? 'Aguarde...'
              : status.connected
                ? status.phoneNumber
                  ? `+${status.phoneNumber}`
                  : 'Pronto para enviar mensagens'
                : status.error || 'Escaneie o QR Code para conectar'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {onRefresh && (
            <Tooltip title="Atualizar status">
              <IconButton onClick={onRefresh} disabled={status.loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
          {!status.connected && !status.loading && (
            <Tooltip title="Conectar WhatsApp">
              <IconButton color="primary" onClick={handleOpenQrModal}>
                <QrCode />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Modal QR Code */}
      <Dialog open={qrModalOpen} onClose={() => setQrModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Conectar WhatsApp</DialogTitle>
        <DialogContent>
          {loadingQr ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : qrCode ? (
            <Box sx={{ textAlign: 'center' }}>
              <Box
                component="img"
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                sx={{ width: '100%', maxWidth: 280, mx: 'auto' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Abra o WhatsApp no seu celular, va em Dispositivos Conectados e escaneie este QR Code
              </Typography>
            </Box>
          ) : (
            <Alert severity="error">
              Erro ao gerar QR Code. Tente novamente.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrModalOpen(false)}>Fechar</Button>
          <Button onClick={fetchQrCode} disabled={loadingQr}>
            Gerar Novo QR
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
