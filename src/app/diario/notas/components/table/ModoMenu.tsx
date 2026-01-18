/**
 * Menu para selecionar modo de entrada de nota.
 */

import { Menu, MenuItem, Typography, Box } from '@mui/material';
import { Edit as EditIcon, Calculate } from '@mui/icons-material';
import { ModoMenuProps } from './types';

export function ModoMenu({ anchorEl, open, onClose, onSelectModo }: ModoMenuProps) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <MenuItem onClick={() => { onSelectModo('direto'); onClose(); }} sx={{ gap: 1.5 }}>
        <EditIcon fontSize="small" color="success" />
        <Box>
          <Typography variant="body2" fontWeight={500}>Nota Direta</Typography>
          <Typography variant="caption" color="text.secondary">
            Digitar a nota manualmente
          </Typography>
        </Box>
      </MenuItem>
      <MenuItem onClick={() => { onSelectModo('composicao'); onClose(); }} sx={{ gap: 1.5 }}>
        <Calculate fontSize="small" color="primary" />
        <Box>
          <Typography variant="body2" fontWeight={500}>Composicao</Typography>
          <Typography variant="caption" color="text.secondary">
            Calcular nota por componentes
          </Typography>
        </Box>
      </MenuItem>
    </Menu>
  );
}
