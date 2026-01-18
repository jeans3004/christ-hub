/**
 * Cabecalho do modal de dossie com botao de exportar.
 */

import {
  DialogTitle,
  Box,
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Close, PictureAsPdf } from '@mui/icons-material';

interface ModalHeaderProps {
  showExport: boolean;
  exporting: boolean;
  onExport: () => void;
  onClose: () => void;
}

export function ModalHeader({ showExport, exporting, onExport, onClose }: ModalHeaderProps) {
  return (
    <DialogTitle
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider',
        pb: 1,
        fontWeight: 600,
      }}
    >
      Dossie do Aluno
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {showExport && (
          <Tooltip title="Exportar PDF">
            <Button
              variant="outlined"
              size="small"
              startIcon={exporting ? <CircularProgress size={16} /> : <PictureAsPdf />}
              onClick={onExport}
              disabled={exporting}
              sx={{ textTransform: 'none' }}
            >
              {exporting ? 'Gerando...' : 'Exportar PDF'}
            </Button>
          </Tooltip>
        )}
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>
    </DialogTitle>
  );
}
