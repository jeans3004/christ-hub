/**
 * Aba de ocorrencias do aluno.
 */

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import { ReportProblem, Check, Pending } from '@mui/icons-material';
import { Ocorrencia } from '@/types';

interface TabPanelOcorrenciasProps {
  ocorrencias: Ocorrencia[];
}

export function TabPanelOcorrencias({ ocorrencias }: TabPanelOcorrenciasProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: Ocorrencia['status']) => {
    switch (status) {
      case 'aprovada':
        return {
          label: 'Aprovada',
          color: 'success' as const,
          icon: <Check fontSize="small" />,
        };
      case 'pendente':
        return {
          label: 'Pendente',
          color: 'warning' as const,
          icon: <Pending fontSize="small" />,
        };
      default:
        return {
          label: status,
          color: 'default' as const,
          icon: null,
        };
    }
  };

  if (ocorrencias.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          minHeight: 200,
        }}
      >
        <ReportProblem sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Nenhuma ocorrencia encontrada
        </Typography>
        <Typography variant="body2" color="text.disabled">
          O aluno nao possui ocorrencias registradas
        </Typography>
      </Box>
    );
  }

  // Separar por status
  const aprovadas = ocorrencias.filter((o) => o.status === 'aprovada');
  const pendentes = ocorrencias.filter((o) => o.status === 'pendente');

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Chip
          label={`${ocorrencias.length} ocorrencia${ocorrencias.length !== 1 ? 's' : ''}`}
          size="small"
          color="default"
        />
        {aprovadas.length > 0 && (
          <Chip
            label={`${aprovadas.length} aprovada${aprovadas.length !== 1 ? 's' : ''}`}
            size="small"
            color="success"
            variant="outlined"
          />
        )}
        {pendentes.length > 0 && (
          <Chip
            label={`${pendentes.length} pendente${pendentes.length !== 1 ? 's' : ''}`}
            size="small"
            color="warning"
            variant="outlined"
          />
        )}
      </Box>

      <List sx={{ p: 0 }}>
        {ocorrencias.map((ocorrencia, index) => {
          const statusConfig = getStatusConfig(ocorrencia.status);

          return (
            <Paper key={ocorrencia.id} variant="outlined" sx={{ mb: 2 }}>
              <ListItem alignItems="flex-start" sx={{ flexDirection: 'column' }}>
                <Box
                  sx={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    {ocorrencia.motivo}
                  </Typography>
                  <Chip
                    icon={statusConfig.icon || undefined}
                    label={statusConfig.label}
                    size="small"
                    color={statusConfig.color}
                  />
                </Box>

                {ocorrencia.descricao && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1, width: '100%' }}
                  >
                    {ocorrencia.descricao}
                  </Typography>
                )}

                <Divider sx={{ width: '100%', my: 1 }} />

                <Box
                  sx={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Registrado por: {ocorrencia.usuarioNome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(ocorrencia.data)}
                  </Typography>
                </Box>

                {ocorrencia.status === 'aprovada' && ocorrencia.aprovadaPor && (
                  <Typography variant="caption" color="success.main" sx={{ mt: 0.5 }}>
                    Aprovada por: {ocorrencia.aprovadaPor}
                    {ocorrencia.aprovadaEm && ` em ${formatDate(ocorrencia.aprovadaEm)}`}
                  </Typography>
                )}
              </ListItem>
            </Paper>
          );
        })}
      </List>
    </Box>
  );
}
