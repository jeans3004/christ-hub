/**
 * Card individual do aluno no dossie.
 */

import {
  Card,
  CardActionArea,
  CardContent,
  Avatar,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { Aluno } from '@/types';

interface AlunoCardProps {
  aluno: Aluno;
  onClick: () => void;
}

export function AlunoCard({ aluno, onClick }: AlunoCardProps) {
  const getInitials = (nome: string) => {
    const parts = nome.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0]?.substring(0, 2).toUpperCase() || '';
  };

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 2,
          }}
        >
          <Avatar
            src={aluno.fotoUrl}
            sx={{
              width: 80,
              height: 80,
              mb: 1.5,
              bgcolor: 'primary.light',
              fontSize: '1.5rem',
            }}
          >
            {!aluno.fotoUrl && (
              aluno.nome ? getInitials(aluno.nome) : <Person />
            )}
          </Avatar>

          <Typography
            variant="subtitle1"
            fontWeight={600}
            align="center"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '3em',
              lineHeight: 1.5,
            }}
          >
            {aluno.nome}
          </Typography>

          {aluno.matricula && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Mat: {aluno.matricula}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
            {aluno.turma && (
              <Chip
                label={aluno.turma}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            <Chip
              label={aluno.ativo ? 'Ativo' : 'Inativo'}
              size="small"
              color={aluno.ativo ? 'success' : 'default'}
              sx={{ fontSize: '0.7rem' }}
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
