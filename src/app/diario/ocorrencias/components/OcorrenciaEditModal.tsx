/**
 * Modal de edicao de ocorrencia.
 */

import { Box, TextField } from '@mui/material';
import FormModal from '@/components/ui/FormModal';
import { Ocorrencia } from '@/types';

interface OcorrenciaEditModalProps {
  open: boolean;
  ocorrencia: Ocorrencia | null;
  onClose: () => void;
  onSave: () => void;
}

export function OcorrenciaEditModal({
  open,
  ocorrencia,
  onClose,
  onSave,
}: OcorrenciaEditModalProps) {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Editar Ocorrência"
      onSubmit={onSave}
    >
      {ocorrencia && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Aluno"
            value={ocorrencia.alunoNome}
            disabled
            fullWidth
          />
          <TextField
            label="Motivo"
            value={ocorrencia.motivo}
            multiline
            rows={3}
            fullWidth
          />
          <TextField
            label="Descrição"
            value={ocorrencia.descricao || ''}
            multiline
            rows={3}
            fullWidth
          />
        </Box>
      )}
    </FormModal>
  );
}
