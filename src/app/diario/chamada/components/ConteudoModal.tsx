/**
 * Modal para registrar conteudo ministrado.
 */

import { Box, TextField } from '@mui/material';
import { FormModal } from '@/components/ui';

interface ConteudoModalProps {
  open: boolean;
  dataConteudo: string;
  conteudo: string;
  onClose: () => void;
  onDataChange: (data: string) => void;
  onConteudoChange: (conteudo: string) => void;
  onSave: () => void;
}

export function ConteudoModal({
  open,
  dataConteudo,
  conteudo,
  onClose,
  onDataChange,
  onConteudoChange,
  onSave,
}: ConteudoModalProps) {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Registrar Conteudo"
      onSubmit={onSave}
      submitLabel="OK"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Data"
          type="date"
          value={dataConteudo}
          onChange={(e) => onDataChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />

        <TextField
          label="Conteudo ministrado"
          multiline
          rows={4}
          value={conteudo}
          onChange={(e) => onConteudoChange(e.target.value)}
          fullWidth
        />
      </Box>
    </FormModal>
  );
}
