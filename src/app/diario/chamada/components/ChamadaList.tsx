/**
 * Componente de lista de alunos para chamada.
 */

import {
  Box,
  Button,
  Typography,
  Checkbox,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Cancel, Save } from '@mui/icons-material';
import { Aluno } from '@/types';
import { getAvatarColor } from '../types';

interface ChamadaListProps {
  alunos: Aluno[];
  presencas: Record<string, boolean>;
  totalPresentes: number;
  totalAusentes: number;
  saving: boolean;
  onPresencaChange: (alunoId: string) => void;
  onMarcarTodos: (presente: boolean) => void;
  onSave: () => Promise<void>;
  onOpenConteudo: () => void;
}

export function ChamadaList({
  alunos,
  presencas,
  totalPresentes,
  totalAusentes,
  saving,
  onPresencaChange,
  onMarcarTodos,
  onSave,
  onOpenConteudo,
}: ChamadaListProps) {
  return (
    <>
      {/* Header with stats and actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            icon={<CheckCircle sx={{ fontSize: 16 }} />}
            label={`${totalPresentes} presentes`}
            size="small"
            sx={{
              bgcolor: 'transparent',
              color: 'success.main',
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'success.main' },
            }}
          />
          <Chip
            icon={<Cancel sx={{ fontSize: 16 }} />}
            label={`${totalAusentes} ausentes`}
            size="small"
            sx={{
              bgcolor: 'transparent',
              color: 'error.main',
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'error.main' },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onMarcarTodos(true)}
            sx={{ textTransform: 'none', borderRadius: 5, fontSize: '0.8rem' }}
          >
            Todos presentes
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => onMarcarTodos(false)}
            sx={{ textTransform: 'none', borderRadius: 5, fontSize: '0.8rem' }}
          >
            Todos ausentes
          </Button>
        </Box>
      </Box>

      {/* Student List */}
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
        {alunos.map((aluno, index) => {
          const isPresente = presencas[aluno.id] ?? true;
          const avatarColor = getAvatarColor(index);
          return (
            <Box
              key={aluno.id}
              onClick={() => onPresencaChange(aluno.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, sm: 2 },
                py: 1.5,
                px: { xs: 0.5, sm: 1 },
                cursor: 'pointer',
                borderBottom: index < alunos.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Checkbox
                checked={isPresente}
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  color: 'success.main',
                  '&.Mui-checked': {
                    color: 'success.main',
                  },
                }}
              />
              <Avatar
                sx={{
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 },
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  fontWeight: 600,
                  bgcolor: avatarColor,
                }}
              >
                {aluno.nome.charAt(0)}
              </Avatar>
              <Typography
                sx={{
                  flex: 1,
                  fontWeight: 500,
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  color: 'text.primary',
                }}
              >
                {aluno.nome}
              </Typography>
              <Button
                size="small"
                variant="contained"
                disableElevation
                sx={{
                  minWidth: { xs: 70, sm: 90 },
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  textTransform: 'none',
                  borderRadius: 1,
                  px: { xs: 1, sm: 2 },
                  bgcolor: isPresente ? 'success.main' : 'error.main',
                  '&:hover': {
                    bgcolor: isPresente ? 'success.dark' : 'error.dark',
                  },
                }}
              >
                {isPresente ? 'Presente' : 'Ausente'}
              </Button>
            </Box>
          );
        })}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          onClick={onOpenConteudo}
          sx={{ textTransform: 'none', borderRadius: 1, px: 3 }}
        >
          Registrar Conteudo
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
          onClick={onSave}
          disabled={saving}
          sx={{ textTransform: 'none', borderRadius: 1, px: 3 }}
        >
          {saving ? 'Salvando...' : 'Salvar Chamada'}
        </Button>
      </Box>
    </>
  );
}
