/**
 * Lista de alunos disponiveis para arrastar para o mapa.
 * Suporta drag-and-drop via mouse e touch (dispositivos moveis).
 */

import { useRef, useCallback } from 'react';
import {
  Paper,
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { AlunoMapa, getIniciais } from '../types';
import { useTouchDrag } from './TouchDragContext';

interface StudentListProps {
  alunosDisponiveis: AlunoMapa[];
  totalAlunos: number;
  loading: boolean;
  onTouchDrop?: (row: number, col: number, alunoId: string) => void;
}

export function StudentList({
  alunosDisponiveis,
  totalAlunos,
  loading,
  onTouchDrop,
}: StudentListProps) {
  const alunosAtribuidos = totalAlunos - alunosDisponiveis.length;
  const { startDrag, updatePosition, endDrag } = useTouchDrag();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleDragStart = (e: React.DragEvent, alunoId: string) => {
    e.dataTransfer.setData('alunoId', alunoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, aluno: AlunoMapa) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    // Don't start drag immediately - wait for some movement to distinguish from tap
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent, aluno: AlunoMapa) => {
    const touch = e.touches[0];
    const startData = touchStartRef.current;

    if (!startData) return;

    // Check if moved enough to start dragging (10px threshold)
    const dx = touch.clientX - startData.x;
    const dy = touch.clientY - startData.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 10) {
      // Prevent scrolling while dragging
      e.preventDefault();

      // Start drag if not already dragging
      startDrag(aluno.id, aluno.nome, aluno.iniciais, touch.clientX, touch.clientY);
      updatePosition(touch.clientX, touch.clientY);
    }
  }, [startDrag, updatePosition]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    const { alunoId, targetElement } = endDrag();

    if (alunoId && targetElement && onTouchDrop) {
      const row = targetElement.getAttribute('data-row');
      const col = targetElement.getAttribute('data-col');

      if (row !== null && col !== null) {
        onTouchDrop(parseInt(row, 10), parseInt(col, 10), alunoId);
      }
    }
  }, [endDrag, onTouchDrop]);

  return (
    <Paper sx={{ p: 2, height: 'fit-content', minWidth: 250 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        Alunos
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Chip
          label={`${alunosAtribuidos} atribuidos`}
          size="small"
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`${alunosDisponiveis.length} disponiveis`}
          size="small"
          color="default"
          variant="outlined"
        />
      </Box>

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Carregando alunos...
        </Typography>
      ) : alunosDisponiveis.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Person sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary">
            Todos os alunos foram atribuidos
          </Typography>
        </Box>
      ) : (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Arraste um aluno para uma mesa
          </Typography>

          <List
            sx={{
              maxHeight: 400,
              overflow: 'auto',
              '& .MuiListItem-root': {
                cursor: 'grab',
                borderRadius: 1,
                mb: 0.5,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '&:active': {
                  cursor: 'grabbing',
                },
              },
            }}
          >
            {alunosDisponiveis.map((aluno) => (
              <ListItem
                key={aluno.id}
                draggable
                onDragStart={(e) => handleDragStart(e, aluno.id)}
                onTouchStart={(e) => handleTouchStart(e, aluno)}
                onTouchMove={(e) => handleTouchMove(e, aluno)}
                onTouchEnd={handleTouchEnd}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  touchAction: 'none', // Prevent browser handling of touch
                  userSelect: 'none',
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={aluno.fotoUrl}
                    sx={{ width: 36, height: 36, bgcolor: 'primary.light' }}
                  >
                    {aluno.iniciais}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={aluno.nome}
                  primaryTypographyProps={{
                    variant: 'body2',
                    noWrap: true,
                  }}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
}
