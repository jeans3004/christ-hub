/**
 * Card individual do aluno no dossie.
 */

import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Chip,
  Button,
  ButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  Person,
  Info,
  Assessment,
  Warning,
  EventNote,
  Description,
} from '@mui/icons-material';
import { Aluno } from '@/types';

interface AlunoCardProps {
  aluno: Aluno;
  onClick: (tabIndex?: number) => void;
}

export function AlunoCard({ aluno, onClick }: AlunoCardProps) {
  const getInitials = (nome: string) => {
    const parts = nome.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0]?.substring(0, 2).toUpperCase() || '';
  };

  const tabs = [
    { icon: <Info fontSize="inherit" />, label: 'Info', index: 0 },
    { icon: <Assessment fontSize="inherit" />, label: 'Notas', index: 1 },
    { icon: <Warning fontSize="inherit" />, label: 'Ocorrências', index: 2 },
    { icon: <EventNote fontSize="inherit" />, label: 'Frequência', index: 3 },
    { icon: <Description fontSize="inherit" />, label: 'Relatórios', index: 4 },
  ];

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 2,
          pb: 1,
          flex: 1,
          cursor: 'pointer',
        }}
        onClick={() => onClick(0)}
      >
        <Avatar
          src={aluno.fotoUrl}
          sx={{
            width: 64,
            height: 64,
            mb: 1,
            bgcolor: 'primary.light',
            fontSize: '1.25rem',
          }}
        >
          {!aluno.fotoUrl && (
            aluno.nome ? getInitials(aluno.nome) : <Person />
          )}
        </Avatar>

        <Typography
          variant="body2"
          fontWeight={600}
          align="center"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.5em',
            lineHeight: 1.3,
            fontSize: '0.85rem',
          }}
        >
          {aluno.nome}
        </Typography>

        {aluno.matricula && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: '0.7rem' }}
          >
            Mat: {aluno.matricula}
          </Typography>
        )}
      </CardContent>

      {/* Botões de abas */}
      <Box sx={{ px: 0.5, pb: 1 }}>
        <ButtonGroup
          variant="outlined"
          size="small"
          fullWidth
          sx={{
            '& .MuiButton-root': {
              minWidth: 0,
              px: 0.5,
              py: 0.5,
              fontSize: '0.65rem',
            },
          }}
        >
          {tabs.map((tab) => (
            <Tooltip key={tab.index} title={tab.label} arrow>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(tab.index);
                }}
                sx={{ fontSize: '1rem' }}
              >
                {tab.icon}
              </Button>
            </Tooltip>
          ))}
        </ButtonGroup>
      </Box>
    </Card>
  );
}
