'use client';

import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
} from '@mui/material';
import { ExpandMore, Delete, History } from '@mui/icons-material';
import type { Sorteio } from '@/services/firestore/sorteioService';

interface DrawHistoryProps {
  historico: Sorteio[];
  loading: boolean;
  onDelete: (id: string) => void;
}

const MODO_LABELS: Record<Sorteio['modo'], string> = {
  individual: 'Sortear 1',
  multiplo: 'Sortear N',
  equipes: 'Equipes',
  sequencia: 'Sequencia',
};

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DrawHistory({ historico, loading, onDelete }: DrawHistoryProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <History color="action" />
        Historico de sorteios
      </Typography>

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Carregando historico...
        </Typography>
      ) : historico.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhum sorteio salvo ainda.
        </Typography>
      ) : (
        historico.map((sorteio) => (
          <Accordion key={sorteio.id} variant="outlined" disableGutters sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ width: '100%', pr: 1 }}
                flexWrap="wrap"
              >
                <Typography variant="body2" fontWeight="bold" sx={{ flexGrow: 1 }}>
                  {sorteio.turmaNome}
                </Typography>
                <Chip label={MODO_LABELS[sorteio.modo]} size="small" variant="outlined" />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(sorteio.createdAt)}
                </Typography>
                <Tooltip title="Excluir sorteio">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(sorteio.id);
                    }}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <HistoricoDetalhe sorteio={sorteio} />
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
}

function HistoricoDetalhe({ sorteio }: { sorteio: Sorteio }) {
  const { modo, resultado } = sorteio;

  if ((modo === 'individual' || modo === 'multiplo' || modo === 'sequencia') && resultado.alunos) {
    return (
      <List dense disablePadding>
        {resultado.alunos.map((aluno, i) => (
          <ListItem key={aluno.id} disablePadding sx={{ py: 0.25 }}>
            <ListItemText
              primary={`${i + 1}. ${aluno.nome}`}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        ))}
      </List>
    );
  }

  if (modo === 'equipes' && resultado.equipes) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {resultado.equipes.map((equipe, i) => (
          <Box key={i}>
            <Typography variant="body2" fontWeight="bold">
              {equipe.nome}
            </Typography>
            <List dense disablePadding>
              {equipe.membros.map((membro, j) => (
                <ListItem key={membro.id} disablePadding sx={{ pl: 2, py: 0.25 }}>
                  <ListItemText
                    primary={`${j + 1}. ${membro.nome}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>
    );
  }

  return <Typography variant="body2" color="text.secondary">Sem dados</Typography>;
}
