/**
 * Modal para marcar aula como nao realizada.
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

interface NaoRealizadaModalProps {
  open: boolean;
  areaNome: string;
  serie: string;
  onClose: () => void;
  onConfirm: (observacao: string) => void;
}

export function NaoRealizadaModal({
  open,
  areaNome,
  serie,
  onClose,
  onConfirm,
}: NaoRealizadaModalProps) {
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (open) {
      setObservacao('');
    }
  }, [open]);

  const handleConfirm = useCallback(() => {
    onConfirm(observacao);
    onClose();
  }, [observacao, onConfirm, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Marcar como Não Realizada</Typography>
        <Typography variant="body2" color="text.secondary">
          {areaNome} - {serie}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            autoFocus
            multiline
            rows={2}
            fullWidth
            label="Motivo (opcional)"
            placeholder="Ex: Feriado, evento escolar, falta de professor..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirm} variant="contained" color="error">
          Marcar como Não Realizada
        </Button>
      </DialogActions>
    </Dialog>
  );
}
