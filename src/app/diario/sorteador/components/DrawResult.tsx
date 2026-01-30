'use client';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  List,
  ListItem,
  ListItemText,
  Fade,
  Grid,
} from '@mui/material';
import { Save, Refresh, EmojiEvents, Groups, FormatListNumbered, Person } from '@mui/icons-material';
import type { Sorteio } from '@/services/firestore/sorteioService';

interface DrawResultProps {
  resultado: Sorteio['resultado'];
  modo: Sorteio['modo'];
  onSalvar: () => void;
  onNovoSorteio: () => void;
  salvando?: boolean;
}

export function DrawResult({ resultado, modo, onSalvar, onNovoSorteio, salvando }: DrawResultProps) {
  if (!resultado.alunos?.length && !resultado.equipes?.length) {
    return null;
  }

  return (
    <Fade in timeout={500}>
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEvents color="primary" />
          Resultado
        </Typography>

        {modo === 'individual' && resultado.alunos?.[0] && (
          <ResultadoIndividual nome={resultado.alunos[0].nome} />
        )}

        {modo === 'multiplo' && resultado.alunos && (
          <ResultadoMultiplo alunos={resultado.alunos} />
        )}

        {modo === 'equipes' && resultado.equipes && (
          <ResultadoEquipes equipes={resultado.equipes} />
        )}

        {modo === 'sequencia' && resultado.alunos && (
          <ResultadoSequencia alunos={resultado.alunos} />
        )}

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={onSalvar}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : 'Salvar no historico'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onNovoSorteio}
          >
            Novo sorteio
          </Button>
        </Stack>
      </Box>
    </Fade>
  );
}

function ResultadoIndividual({ nome }: { nome: string }) {
  return (
    <Card
      sx={{
        textAlign: 'center',
        py: 4,
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.main}05)`,
        border: (theme) => `2px solid ${theme.palette.primary.main}40`,
      }}
    >
      <CardContent>
        <Person sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          {nome}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ResultadoMultiplo({ alunos }: { alunos: { id: string; nome: string }[] }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {alunos.map((aluno, index) => (
        <Chip
          key={aluno.id}
          label={`${index + 1}. ${aluno.nome}`}
          color="primary"
          variant="outlined"
          sx={{ fontSize: '0.9rem', py: 2 }}
        />
      ))}
    </Box>
  );
}

function ResultadoEquipes({
  equipes,
}: {
  equipes: { nome: string; membros: { id: string; nome: string }[] }[];
}) {
  return (
    <Grid container spacing={2}>
      {equipes.map((equipe, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
          <Card variant="outlined">
            <CardContent>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Groups fontSize="small" color="primary" />
                {equipe.nome}
              </Typography>
              <List dense disablePadding>
                {equipe.membros.map((membro, i) => (
                  <ListItem key={membro.id} disablePadding sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={`${i + 1}. ${membro.nome}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function ResultadoSequencia({ alunos }: { alunos: { id: string; nome: string }[] }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <FormatListNumbered fontSize="small" color="primary" />
          Sequencia aleatoria
        </Typography>
        <List dense disablePadding>
          {alunos.map((aluno, index) => (
            <ListItem key={aluno.id} disablePadding sx={{ py: 0.25 }}>
              <ListItemText
                primary={`${index + 1}. ${aluno.nome}`}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
