/**
 * Modal de resultado do salvamento duplo (Luminar + SGE).
 */

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Link } from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

interface SyncResultModalProps {
  open: boolean;
  onClose: () => void;
  luminar: boolean;
  sge: boolean;
  sgeMessage: string;
}

export function SyncResultModal({ open, onClose, luminar, sge, sgeMessage }: SyncResultModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Resultado do salvamento</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
          {/* Luminar result */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {luminar ? (
              <CheckCircle sx={{ color: 'success.main', fontSize: 28 }} />
            ) : (
              <ErrorIcon sx={{ color: 'error.main', fontSize: 28 }} />
            )}
            <Typography variant="body1" fontWeight={500}>
              {luminar ? 'Chamada salva no Luminar' : 'Erro ao salvar no Luminar'}
            </Typography>
          </Box>

          {/* SGE result */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {sge ? (
              <CheckCircle sx={{ color: 'success.main', fontSize: 28 }} />
            ) : (
              <ErrorIcon sx={{ color: 'error.main', fontSize: 28 }} />
            )}
            <Typography variant="body1" fontWeight={500}>
              {sgeMessage}
            </Typography>
          </Box>

          {/* Link to e-aluno */}
          <Link
            href="https://e-aluno.com.br/christ/diario/chamadas.php"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ fontSize: '0.85rem', mt: 1 }}
          >
            Verificar no e-aluno
          </Link>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
