/**
 * Grid de cards de alunos.
 */

import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { School } from '@mui/icons-material';
import { Aluno } from '@/types';
import { AlunoCard } from './AlunoCard';

interface AlunoCardListProps {
  alunos: Aluno[];
  loading: boolean;
  turmaId: string;
  onCardClick: (alunoId: string, tabIndex?: number) => void;
}

export function AlunoCardList({
  alunos,
  loading,
  turmaId,
  onCardClick,
}: AlunoCardListProps) {
  if (!turmaId) {
    return (
      <Paper
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          minHeight: 300,
        }}
      >
        <School sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Selecione uma turma
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Escolha uma turma nos filtros para visualizar os alunos
        </Typography>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          minHeight: 300,
        }}
      >
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Carregando alunos...
        </Typography>
      </Paper>
    );
  }

  if (alunos.length === 0) {
    return (
      <Paper
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          minHeight: 300,
        }}
      >
        <School sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Nenhum aluno encontrado
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Esta turma ainda nao possui alunos cadastrados
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} encontrado{alunos.length !== 1 ? 's' : ''}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
          gap: 2,
        }}
      >
        {alunos.map((aluno) => (
          <AlunoCard
            key={aluno.id}
            aluno={aluno}
            onClick={(tabIndex) => onCardClick(aluno.id, tabIndex)}
          />
        ))}
      </Box>
    </Box>
  );
}
