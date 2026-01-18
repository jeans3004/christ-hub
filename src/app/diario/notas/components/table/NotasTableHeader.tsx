/**
 * Cabecalho da tabela de notas.
 */

import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { NotasTableHeaderProps } from './types';

export function NotasTableHeader({ onOpenTemplateModal }: NotasTableHeaderProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '35px 1fr repeat(4, 70px) 50px', sm: '40px 1fr repeat(4, 90px) 60px' },
        gap: { xs: 0.5, sm: 1 },
        px: { xs: 1, sm: 2 },
        py: 1.5,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px 8px 0 0',
        alignItems: 'center',
      }}
    >
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" textAlign="center">
        Nº
      </Typography>
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
        Nome
      </Typography>
      <ColumnHeader label="AV1" onEdit={() => onOpenTemplateModal('av1')} />
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" textAlign="center">
        RP1
      </Typography>
      <ColumnHeader label="AV2" onEdit={() => onOpenTemplateModal('av2')} />
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" textAlign="center">
        RP2
      </Typography>
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" textAlign="center">
        Media
      </Typography>
    </Box>
  );
}

function ColumnHeader({ label, onEdit }: { label: string; onEdit: () => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
        {label}
      </Typography>
      <Tooltip title={`Editar composição da ${label}`}>
        <IconButton size="small" onClick={onEdit} sx={{ p: 0.25 }}>
          <EditIcon sx={{ fontSize: 14, color: 'primary.main' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
