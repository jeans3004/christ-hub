/**
 * Celula individual do mapa de sala.
 */

import { useRef } from 'react';
import { Box, Avatar, Typography, Tooltip } from '@mui/material';
import { Person, Block, School } from '@mui/icons-material';
import { CelulaMapa, TIPO_COLORS, ModoEdicao } from '../types';
import { useTouchDrag } from './TouchDragContext';

interface SeatCellProps {
  celula: CelulaMapa;
  modoEdicao: ModoEdicao;
  selected: boolean;
  onCelulaClick: () => void;
  onDrop: (alunoId: string) => void;
  onTouchDrop?: (targetRow: number, targetCol: number, alunoId: string) => void;
  row: number;
  col: number;
}

export function SeatCell({
  celula,
  modoEdicao,
  selected,
  onCelulaClick,
  onDrop,
  onTouchDrop,
  row,
  col,
}: SeatCellProps) {
  const colors = TIPO_COLORS[celula.tipo];
  const { startDrag, updatePosition, endDrag } = useTouchDrag();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (celula.aluno) {
      e.dataTransfer.setData('alunoId', celula.aluno.id);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (celula.tipo === 'mesa') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const alunoId = e.dataTransfer.getData('alunoId');
    if (alunoId && celula.tipo === 'mesa') {
      onDrop(alunoId);
    }
  };

  const isDraggable = celula.tipo === 'mesa' && celula.aluno !== undefined;

  // Touch handlers for mobile drag from seats
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!celula.aluno) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!celula.aluno || !touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    // Start drag if moved more than 10px
    if (!isDraggingRef.current && (dx > 10 || dy > 10)) {
      isDraggingRef.current = true;
      const iniciais = celula.aluno.iniciais || celula.aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
      startDrag(celula.aluno.id, celula.aluno.nome, iniciais, touch.clientX, touch.clientY);
    }

    if (isDraggingRef.current) {
      e.preventDefault();
      updatePosition(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    if (isDraggingRef.current) {
      const result = endDrag();
      if (result.alunoId && result.targetElement) {
        const targetRow = result.targetElement.getAttribute('data-row');
        const targetCol = result.targetElement.getAttribute('data-col');
        if (targetRow !== null && targetCol !== null) {
          const targetRowNum = parseInt(targetRow, 10);
          const targetColNum = parseInt(targetCol, 10);
          // Usar onTouchDrop se disponível (permite passar coordenadas do destino)
          if (onTouchDrop) {
            onTouchDrop(targetRowNum, targetColNum, result.alunoId);
          }
        }
      }
    }
    touchStartRef.current = null;
    isDraggingRef.current = false;
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
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onClick={onCelulaClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-seat-cell="true"
      data-row={row}
      data-col={col}
      data-aluno-id={celula.aluno?.id || ''}
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
        cursor: isDraggable ? 'grab' : 'pointer',
        transition: 'all 0.2s',
        boxShadow: selected ? 3 : 0,
        userSelect: 'none',
        touchAction: isDraggable ? 'none' : 'auto',
        '&:hover': {
          borderColor: 'primary.light',
          transform: 'scale(1.02)',
        },
        '&:active': {
          cursor: isDraggable ? 'grabbing' : 'pointer',
        },
      }}
    >
      {renderContent()}
    </Box>
  );
}
