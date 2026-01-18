/**
 * Cabecalho de grupo de rubricas.
 */

import { Box, Typography, Chip } from '@mui/material';
import { School, Person, ExpandMore } from '@mui/icons-material';
import type { GrupoHeaderProps } from './types';

export function GrupoHeader({ grupo, isExpanded, onToggle }: GrupoHeaderProps) {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: grupo.tipo === 'geral' ? 'primary.main' : 'secondary.main',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
      }}
      onClick={onToggle}
    >
      {grupo.tipo === 'geral' ? <School /> : <Person />}
      <Typography fontWeight={600} sx={{ flex: 1 }}>
        {grupo.nome}
      </Typography>
      <Chip
        label={`${grupo.rubricas.length} rubrica${grupo.rubricas.length !== 1 ? 's' : ''}`}
        size="small"
        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
      />
      <ExpandMore
        sx={{
          transform: isExpanded ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
        }}
      />
    </Box>
  );
}
