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
} from '@mui/material';
import { Group, Send, Close } from '@mui/icons-material';
import { GrupoWhatsApp } from '@/types';
import { useGrupos } from '../../hooks';
import { MediaData } from '../../types';
import { MensagemComposer } from '../MensagemComposer';

interface GrupoSendModalProps {
  open: boolean;
  onClose: () => void;
  grupo: GrupoWhatsApp | null;
  onSuccess?: () => void;
}

export function GrupoSendModal({ open, onClose, grupo, onSuccess }: GrupoSendModalProps) {
  const [mensagem, setMensagem] = useState('');
  const [media, setMedia] = useState<MediaData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { sendToGroup, sendMediaToGroup, sending } = useGrupos();

  const handleClose = useCallback(() => {
    setMensagem('');
    setMedia(undefined);
    setError(null);
    setSuccess(false);
    onClose();
  }, [onClose]);

  const handleSend = useCallback(async () => {
    if (!grupo) return;
    if (!mensagem.trim() && !media) return;

    setError(null);
    let result: { success: boolean; error?: string };

    if (media) {
      // Enviar mídia para grupo
      result = await sendMediaToGroup(grupo.id, media, mensagem.trim());
    } else {
      // Enviar texto para grupo
      result = await sendToGroup(grupo.id, mensagem.trim());
    }

    if (result.success) {
      setSuccess(true);
      setMensagem('');
      setMedia(undefined);
      onSuccess?.();
      // Fechar apos delay para mostrar sucesso
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setError(result.error || 'Erro ao enviar mensagem');
    }
  }, [grupo, mensagem, media, sendToGroup, sendMediaToGroup, onSuccess, handleClose]);

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

        <MensagemComposer
          value={mensagem}
          onChange={setMensagem}
          disabled={sending || success}
          sending={sending}
          media={media}
          onMediaChange={setMedia}
          allowMedia={true}
          placeholder="Digite sua mensagem para o grupo..."
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
          disabled={(!mensagem.trim() && !media) || sending || success}
        >
          {sending ? 'Enviando...' : (media ? 'Enviar Mídia' : 'Enviar')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
