/**
 * Lista de alunos disponiveis para arrastar para o mapa.
 * Suporta drag-and-drop via mouse e touch (dispositivos moveis).
 * Redesign com melhor UX.
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
  InputBase,
  IconButton,
} from '@mui/material';
import { Person, Search, Clear, DragIndicator } from '@mui/icons-material';
import { useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
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
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent, aluno: AlunoMapa) => {
    const touch = e.touches[0];
    const startData = touchStartRef.current;

    if (!startData) return;

    const dx = touch.clientX - startData.x;
    const dy = touch.clientY - startData.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 10) {
      e.preventDefault();
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

  // Filtrar alunos pela busca
  const filteredAlunos = alunosDisponiveis.filter(aluno =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: 'fit-content',
        minWidth: { xs: '100%', sm: 280 },
        maxWidth: { xs: '100%', sm: 320 },
        bgcolor: 'grey.50',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Person sx={{ color: 'primary.main' }} />
        <Typography variant="subtitle1" fontWeight={600}>
          Alunos
        </Typography>
      </Box>

      {/* Estatisticas */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          label={`${alunosAtribuidos} na sala`}
          size="small"
          color="primary"
          variant="filled"
          sx={{ fontWeight: 500 }}
        />
        <Chip
          label={`${alunosDisponiveis.length} disponiveis`}
          size="small"
          color="default"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      </Box>

      {/* Campo de busca */}
      {alunosDisponiveis.length > 5 && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.300',
          px: 1.5,
          py: 0.5,
          mb: 2,
        }}>
          <Search sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
          <InputBase
            placeholder="Buscar aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, fontSize: '0.875rem' }}
          />
          {searchTerm && (
            <IconButton size="small" onClick={() => setSearchTerm('')}>
              <Clear sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>
      )}

      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          Carregando alunos...
        </Typography>
      ) : alunosDisponiveis.length === 0 ? (
        <Box sx={{
          textAlign: 'center',
          py: 4,
          bgcolor: 'success.light',
          borderRadius: 2,
          opacity: 0.9,
        }}>
          <Person sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
          <Typography variant="body2" color="success.dark" fontWeight={500}>
            Todos os alunos foram atribuidos!
          </Typography>
        </Box>
      ) : filteredAlunos.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          Nenhum aluno encontrado
        </Typography>
      ) : (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
            Arraste um aluno para uma mesa
          </Typography>

          <List
            sx={{
              maxHeight: { xs: 250, sm: 350 },
              overflow: 'auto',
              '& .MuiListItem-root': {
                cursor: 'grab',
                borderRadius: 2,
                mb: 0.75,
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: 'primary.light',
                  transform: 'translateX(4px)',
                  '& .drag-indicator': {
                    opacity: 1,
                  },
                },
                '&:active': {
                  cursor: 'grabbing',
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiAvatar-root': {
                    borderColor: 'white',
                  },
                  '& .MuiListItemText-primary': {
                    color: 'white',
                  },
                },
              },
            }}
          >
            {filteredAlunos.map((aluno) => (
              <ListItem
                key={aluno.id}
                draggable
                onDragStart={(e) => handleDragStart(e, aluno.id)}
                onTouchStart={(e) => handleTouchStart(e, aluno)}
                onTouchMove={(e) => handleTouchMove(e, aluno)}
                onTouchEnd={handleTouchEnd}
                sx={{
                  border: '1px solid',
                  borderColor: 'grey.200',
                  bgcolor: 'background.paper',
                  touchAction: 'none',
                  userSelect: 'none',
                  pr: 1,
                }}
              >
                <Box
                  className="drag-indicator"
                  sx={{
                    opacity: 0.3,
                    mr: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <DragIndicator sx={{ fontSize: 18, color: 'text.secondary' }} />
                </Box>
                <ListItemAvatar sx={{ minWidth: 44 }}>
                  <Avatar
                    src={aluno.fotoUrl}
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: 'primary.main',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: '2px solid',
                      borderColor: 'primary.light',
                    }}
                  >
                    {aluno.iniciais}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={aluno.nome}
                  primaryTypographyProps={{
                    variant: 'body2',
                    noWrap: true,
                    fontWeight: 500,
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
