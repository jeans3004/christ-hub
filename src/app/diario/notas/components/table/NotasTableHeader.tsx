/**
 * Cabecalho da tabela de notas.
 * Colunas coloridas para melhor identificacao visual.
 */

import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { NotasTableHeaderProps } from './types';

// Cores para cada coluna
const COLUMN_COLORS = {
  av1: { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },     // Azul
  rp1: { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },     // Laranja
  av2: { bg: '#f3e5f5', text: '#7b1fa2', border: '#ce93d8' },     // Roxo
  rp2: { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },     // Laranja
  media: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },   // Verde
};

export function NotasTableHeader({ onOpenTemplateModal }: NotasTableHeaderProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '35px 1fr repeat(4, 70px) 50px', sm: '40px 1fr repeat(4, 90px) 60px' },
        gap: { xs: 0.5, sm: 1 },
        px: { xs: 1, sm: 2 },
        py: 1,
        bgcolor: 'background.paper',
        borderBottom: '2px solid',
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
      <ColumnHeader label="AV1" color={COLUMN_COLORS.av1} onEdit={() => onOpenTemplateModal('av1')} />
      <ColumnHeader label="RP1" color={COLUMN_COLORS.rp1} onEdit={() => onOpenTemplateModal('rp1')} />
      <ColumnHeader label="AV2" color={COLUMN_COLORS.av2} onEdit={() => onOpenTemplateModal('av2')} />
      <ColumnHeader label="RP2" color={COLUMN_COLORS.rp2} onEdit={() => onOpenTemplateModal('rp2')} />
      <ColumnChip label="Média" color={COLUMN_COLORS.media} />
    </Box>
  );
}

interface ColumnColor {
  bg: string;
  text: string;
  border: string;
}

function ColumnHeader({ label, color, onEdit }: { label: string; color: ColumnColor; onEdit: () => void }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.25,
        bgcolor: color.bg,
        borderRadius: 1,
        py: 0.5,
        px: 0.5,
        border: '1px solid',
        borderColor: color.border,
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ color: color.text, fontSize: '0.8rem' }}>
        {label}
      </Typography>
      <Tooltip title={`Editar composição da ${label}`}>
        <IconButton size="small" onClick={onEdit} sx={{ p: 0.25 }}>
          <EditIcon sx={{ fontSize: 14, color: color.text }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function ColumnChip({ label, color }: { label: string; color: ColumnColor }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: color.bg,
        borderRadius: 1,
        py: 0.5,
        px: 0.5,
        border: '1px solid',
        borderColor: color.border,
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ color: color.text, fontSize: '0.8rem' }}>
        {label}
      </Typography>
    </Box>
  );
}
