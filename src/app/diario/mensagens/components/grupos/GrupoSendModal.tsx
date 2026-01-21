/**
 * Modal para enviar mensagem para grupo do WhatsApp.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import { Group, Send, Close } from '@mui/icons-material';
import { GrupoWhatsApp } from '@/types';
import { useGrupos } from '../../hooks';

interface GrupoSendModalProps {
  open: boolean;
  onClose: () => void;
  grupo: GrupoWhatsApp | null;
  onSuccess?: () => void;
}

export function GrupoSendModal({ open, onClose, grupo, onSuccess }: GrupoSendModalProps) {
  const [mensagem, setMensagem] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { sendToGroup, sending } = useGrupos();

  const handleClose = useCallback(() => {
    setMensagem('');
    setError(null);
    setSuccess(false);
    onClose();
  }, [onClose]);

  const handleSend = useCallback(async () => {
    if (!grupo || !mensagem.trim()) return;

    setError(null);
    const result = await sendToGroup(grupo.id, mensagem.trim());

    if (result.success) {
      setSuccess(true);
      setMensagem('');
      onSuccess?.();
      // Fechar apos delay para mostrar sucesso
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setError(result.error || 'Erro ao enviar mensagem');
    }
  }, [grupo, mensagem, sendToGroup, onSuccess, handleClose]);

  if (!grupo) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar src={grupo.profilePicUrl} sx={{ bgcolor: 'primary.main' }}>
          <Group />
        </Avatar>
        <Box>
          <Typography variant="h6">{grupo.nome}</Typography>
          <Typography variant="body2" color="text.secondary">
            {grupo.participantes} participantes
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Mensagem enviada com sucesso!
          </Alert>
        )}

        <TextField
          label="Mensagem"
          multiline
          rows={6}
          fullWidth
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          disabled={sending || success}
          placeholder="Digite sua mensagem..."
          helperText="Use *negrito*, _italico_, ~tachado~ para formatar"
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          startIcon={<Close />}
          disabled={sending}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <Send />}
          disabled={!mensagem.trim() || sending || success}
        >
          {sending ? 'Enviando...' : 'Enviar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
