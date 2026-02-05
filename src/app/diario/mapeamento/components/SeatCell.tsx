/**
 * Celula individual do mapa de sala - Redesign com melhor visual e feedback.
 */

import { useRef } from 'react';
import { Box, Avatar, Typography, Tooltip } from '@mui/material';
import { Person, Block, School, SwapHoriz } from '@mui/icons-material';
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
  size?: number;
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
  size = 64,
}: SeatCellProps) {
  const colors = TIPO_COLORS[celula.tipo];
  const { startDrag, updatePosition, endDrag, dragState } = useTouchDrag();
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
          if (onTouchDrop) {
            onTouchDrop(targetRowNum, targetColNum, result.alunoId);
          }
        }
      }
    }
    touchStartRef.current = null;
    isDraggingRef.current = false;
  };

  // Verificar se esta celula e o destino potencial do drag atual
  const isDropTarget = dragState.isDragging && celula.tipo === 'mesa';
  const hasOccupant = celula.tipo === 'mesa' && celula.alunoId;

  const renderContent = () => {
    if (celula.tipo === 'vazio') {
      return (
        <Block sx={{ fontSize: size * 0.3, color: 'text.disabled', opacity: 0.5 }} />
      );
    }

    if (celula.tipo === 'professor') {
      return (
        <Box sx={{ textAlign: 'center' }}>
          <School sx={{ fontSize: size * 0.35, color: 'warning.main' }} />
          <Typography variant="caption" sx={{
            display: 'block',
            mt: 0.25,
            fontSize: Math.max(9, size * 0.12),
            fontWeight: 500,
          }}>
            Prof.
          </Typography>
        </Box>
      );
    }

    // Tipo mesa
    if (celula.aluno) {
      const avatarSize = Math.max(28, size * 0.45);
      return (
        <Tooltip title={celula.aluno.nome} arrow enterDelay={300}>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              src={celula.aluno.fotoUrl}
              sx={{
                width: avatarSize,
                height: avatarSize,
                mx: 'auto',
                bgcolor: 'primary.main',
                fontSize: Math.max(10, avatarSize * 0.4),
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {celula.aluno.iniciais}
            </Avatar>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.25,
                maxWidth: size - 8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: Math.max(8, size * 0.13),
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              {celula.aluno.nome.split(' ')[0]}
            </Typography>
          </Box>
        </Tooltip>
      );
    }

    return (
      <Box sx={{ textAlign: 'center', opacity: 0.4 }}>
        <Person sx={{ fontSize: size * 0.35, color: 'text.disabled' }} />
      </Box>
    );
  };

  // Determinar borda e cor baseado no estado
  const getBorderStyle = () => {
    if (selected) return { borderColor: 'primary.main', borderWidth: 2 };
    if (isDropTarget && !hasOccupant) return { borderColor: 'success.main', borderWidth: 2 };
    if (isDropTarget && hasOccupant) return { borderColor: 'warning.main', borderWidth: 2 };
    if (hasOccupant) return { borderColor: '#1565c0', borderWidth: 2 };
    return { borderColor: colors.border, borderWidth: 1 };
  };

  const borderStyle = getBorderStyle();

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
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: hasOccupant ? '#bbdefb' : colors.bg,
        border: `${borderStyle.borderWidth}px solid`,
        borderColor: borderStyle.borderColor,
        borderRadius: 2,
        cursor: isDraggable ? 'grab' : 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: selected ? '0 0 0 3px rgba(25, 118, 210, 0.3)' : (hasOccupant ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'),
        userSelect: 'none',
        touchAction: isDraggable ? 'none' : 'auto',
        position: 'relative',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'scale(1.03)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
        },
        '&:active': {
          cursor: isDraggable ? 'grabbing' : 'pointer',
          transform: 'scale(0.98)',
        },
      }}
    >
      {renderContent()}
      {/* Indicador de swap quando tem ocupante e esta recebendo drag */}
      {isDropTarget && hasOccupant && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            bgcolor: 'warning.main',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <SwapHoriz sx={{ fontSize: 14, color: 'white' }} />
        </Box>
      )}
    </Box>
  );
}
