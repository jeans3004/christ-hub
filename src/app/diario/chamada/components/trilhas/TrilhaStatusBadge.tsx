/**
 * Badge visual de status da chamada de Trilha.
 */

'use client';

import { Chip, Tooltip } from '@mui/material';
import {
  CheckCircle as RealizadaIcon,
  Cancel as NaoRealizadaIcon,
  Pending as PendenteIcon,
  Edit as EmAndamentoIcon,
} from '@mui/icons-material';

type StatusTrilha = 'realizada' | 'nao_realizada' | 'em_andamento' | 'pendente';

interface TrilhaStatusBadgeProps {
  realizada: boolean;
  hasChanges: boolean;
  hasChamada: boolean;
  observacao?: string;
}

export function TrilhaStatusBadge({ realizada, hasChanges, hasChamada, observacao }: TrilhaStatusBadgeProps) {
  let status: StatusTrilha;
  if (hasChanges) {
    status = 'em_andamento';
  } else if (hasChamada) {
    status = realizada ? 'realizada' : 'nao_realizada';
  } else {
    status = 'pendente';
  }

  const config = {
    realizada: { label: 'Realizada', color: 'success' as const, icon: <RealizadaIcon fontSize="small" /> },
    nao_realizada: { label: 'Não realizada', color: 'default' as const, icon: <NaoRealizadaIcon fontSize="small" /> },
    em_andamento: { label: 'Editando', color: 'warning' as const, icon: <EmAndamentoIcon fontSize="small" /> },
    pendente: { label: 'Pendente', color: 'info' as const, icon: <PendenteIcon fontSize="small" /> },
  };

  const { label, color, icon } = config[status];

  const badge = (
    <Chip
      size="small"
      label={label}
      color={color}
      icon={icon}
      sx={{ height: 24, '& .MuiChip-icon': { fontSize: 16 } }}
    />
  );

  if (observacao && status === 'nao_realizada') {
    return (
      <Tooltip title={observacao} arrow>
        {badge}
      </Tooltip>
    );
  }

  return badge;
}
