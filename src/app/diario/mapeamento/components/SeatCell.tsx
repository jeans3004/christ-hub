/**
 * Celula individual do mapa de sala.
 */

import { Box, Avatar, Typography, Tooltip } from '@mui/material';
import { Person, Block, School } from '@mui/icons-material';
import { CelulaMapa, TIPO_COLORS, ModoEdicao } from '../types';

interface SeatCellProps {
  celula: CelulaMapa;
  modoEdicao: ModoEdicao;
  selected: boolean;
  onCelulaClick: () => void;
  onDrop: (alunoId: string) => void;
}

export function SeatCell({
  celula,
  modoEdicao,
  selected,
  onCelulaClick,
  onDrop,
}: SeatCellProps) {
  const colors = TIPO_COLORS[celula.tipo];

  const handleDragOver = (e: React.DragEvent) => {
    if (celula.tipo === 'mesa') {
      e.preventDefault();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const alunoId = e.dataTransfer.getData('alunoId');
    if (alunoId && celula.tipo === 'mesa') {
      onDrop(alunoId);
    }
  };

  const renderContent = () => {
    if (celula.tipo === 'vazio') {
      return (
        <Block sx={{ fontSize: 24, color: 'text.disabled' }} />
      );
    }

    if (celula.tipo === 'professor') {
      return (
        <Box sx={{ textAlign: 'center' }}>
          <School sx={{ fontSize: 28, color: 'warning.main' }} />
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
            Professor
          </Typography>
        </Box>
      );
    }

    // Tipo mesa
    if (celula.aluno) {
      return (
        <Tooltip title={celula.aluno.nome} arrow>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              src={celula.aluno.fotoUrl}
              sx={{
                width: 40,
                height: 40,
                mx: 'auto',
                bgcolor: 'primary.main',
                fontSize: '0.9rem',
              }}
            >
              {celula.aluno.iniciais}
            </Avatar>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.5,
                maxWidth: 70,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {celula.aluno.nome.split(' ')[0]}
            </Typography>
          </Box>
        </Tooltip>
      );
    }

    return (
      <Box sx={{ textAlign: 'center' }}>
        <Person sx={{ fontSize: 28, color: 'text.disabled' }} />
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
          Vazio
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      onClick={onCelulaClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        width: 80,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: colors.bg,
        border: 2,
        borderColor: selected ? 'primary.main' : colors.border,
        borderRadius: 1,
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: selected ? 3 : 0,
        '&:hover': {
          borderColor: 'primary.light',
          transform: 'scale(1.02)',
        },
      }}
    >
      {renderContent()}
    </Box>
  );
}
