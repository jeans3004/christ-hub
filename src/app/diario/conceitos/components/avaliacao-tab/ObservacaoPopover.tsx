/**
 * Popover para adicionar/editar observacoes de alunos.
 */

import { useState, useEffect } from 'react';
import {
  Popover,
  Box,
  TextField,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';

interface ObservacaoPopoverProps {
  anchorEl: HTMLElement | null;
  alunoNome: string;
  observacao: string;
  onClose: () => void;
  onSave: (observacao: string) => void;
}

export function ObservacaoPopover({
  anchorEl,
  alunoNome,
  observacao,
  onClose,
  onSave,
}: ObservacaoPopoverProps) {
  const [texto, setTexto] = useState(observacao);

  useEffect(() => {
    setTexto(observacao);
  }, [observacao, anchorEl]);

  const handleSave = () => {
    onSave(texto);
    onClose();
  };

  const open = Boolean(anchorEl);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      slotProps={{
        paper: {
          sx: { width: 320, p: 2 },
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Observação - {alunoNome}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <TextField
        multiline
        rows={3}
        fullWidth
        placeholder="Digite uma observação sobre o aluno..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        variant="outlined"
        size="small"
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
        >
          Salvar
        </Button>
      </Box>
    </Popover>
  );
}
