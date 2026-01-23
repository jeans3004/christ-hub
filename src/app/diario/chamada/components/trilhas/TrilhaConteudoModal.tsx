/**
 * Modal para registrar conteudo ministrado na Trilha.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material';

interface TrilhaConteudoModalProps {
  open: boolean;
  areaNome: string;
  serie: string;
  conteudo: string;
  onClose: () => void;
  onSave: (conteudo: string) => void;
}

export function TrilhaConteudoModal({
  open,
  areaNome,
  serie,
  conteudo,
  onClose,
  onSave,
}: TrilhaConteudoModalProps) {
  const [texto, setTexto] = useState(conteudo);

  useEffect(() => {
    if (open) {
      setTexto(conteudo);
    }
  }, [open, conteudo]);

  const handleSave = useCallback(() => {
    onSave(texto);
    onClose();
  }, [texto, onSave, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSave();
    }
  }, [handleSave]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Conteúdo Ministrado</Typography>
        <Typography variant="body2" color="text.secondary">
          {areaNome} - {serie}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            label="Conteúdo da aula"
            placeholder="Descreva o conteúdo ministrado nesta aula..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Dica: Ctrl+Enter para salvar
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
