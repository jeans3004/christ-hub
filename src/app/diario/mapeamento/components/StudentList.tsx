/**
 * Lista de alunos disponiveis para arrastar para o mapa.
 */

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
import { AlunoMapa } from '../types';

interface StudentListProps {
  alunosDisponiveis: AlunoMapa[];
  totalAlunos: number;
  loading: boolean;
}

export function StudentList({
  alunosDisponiveis,
  totalAlunos,
  loading,
}: StudentListProps) {
  const alunosAtribuidos = totalAlunos - alunosDisponiveis.length;

  const handleDragStart = (e: React.DragEvent, alunoId: string) => {
    e.dataTransfer.setData('alunoId', alunoId);
    e.dataTransfer.effectAllowed = 'move';
  };

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
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
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
