/**
 * Aba de avaliacoes por rubricas do aluno.
 */

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { AssignmentTurnedIn } from '@mui/icons-material';
import { NivelRubrica } from '@/types';
import { AvaliacaoRubricaComDetalhes, NIVEL_COLORS, NIVEL_DESCRICOES } from '../types';

interface TabPanelAvaliacoesProps {
  avaliacoes: AvaliacaoRubricaComDetalhes[];
}

export function TabPanelAvaliacoes({ avaliacoes }: TabPanelAvaliacoesProps) {
  if (avaliacoes.length === 0) {
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
        <AssignmentTurnedIn sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Nenhuma avaliacao encontrada
        </Typography>
        <Typography variant="body2" color="text.disabled">
          O aluno ainda nao possui avaliacoes por rubricas registradas
        </Typography>
      </Box>
    );
  }

  // Agrupar avaliacoes por bimestre e disciplina
  const avaliacoesPorBimestre = avaliacoes.reduce((acc, av) => {
    const key = `${av.ano}-${av.bimestre}`;
    if (!acc[key]) {
      acc[key] = {
        ano: av.ano,
        bimestre: av.bimestre,
        avaliacoes: [],
      };
    }
    acc[key].avaliacoes.push(av);
    return acc;
  }, {} as Record<string, { ano: number; bimestre: number; avaliacoes: AvaliacaoRubricaComDetalhes[] }>);

  const bimestresOrdenados = Object.values(avaliacoesPorBimestre).sort(
    (a, b) => b.ano - a.ano || b.bimestre - a.bimestre
  );

  const renderNivelChip = (nivel: NivelRubrica) => {
    const colors = NIVEL_COLORS[nivel];
    const descricao = NIVEL_DESCRICOES[nivel];

    return (
      <Chip
        label={nivel}
        size="small"
        sx={{
          bgcolor: colors.bg,
          color: colors.text,
          fontWeight: 600,
          minWidth: 32,
        }}
        title={descricao}
      />
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      {bimestresOrdenados.map(({ ano, bimestre, avaliacoes: avs }) => (
        <Box key={`${ano}-${bimestre}`} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            {bimestre}o Bimestre - {ano}
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Disciplina</TableCell>
                  <TableCell>Rubrica</TableCell>
                  <TableCell>AV</TableCell>
                  <TableCell align="center">Nivel</TableCell>
                  <TableCell>Observacao</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {avs.map((av) => (
                  <TableRow key={av.id}>
                    <TableCell>{av.disciplinaNome}</TableCell>
                    <TableCell>{av.rubricaNome}</TableCell>
                    <TableCell>
                      {av.av && (
                        <Chip
                          label={av.av.toUpperCase()}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {renderNivelChip(av.nivel)}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={av.observacao}
                      >
                        {av.observacao || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Legenda dos Niveis
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {(Object.keys(NIVEL_COLORS) as NivelRubrica[]).map((nivel) => (
            <Box key={nivel} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {renderNivelChip(nivel)}
              <Typography variant="caption" color="text.secondary">
                {NIVEL_DESCRICOES[nivel]}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
