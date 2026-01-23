/**
 * Relatorio Consolidado - Resumo geral de todas as turmas.
 */

import { useRef, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  LinearProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Print as PrintIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Class as ClassIcon,
} from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario } from '@/types';
import { formatPeriodo, printReport } from './utils';

interface RelatorioConsolidadoProps {
  chamadas: Chamada[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  professor: Usuario | null;
  dataInicio: string;
  dataFim: string;
}

interface TurmaConsolidado {
  turmaId: string;
  turmaNome: string;
  chamadas: number;
  presencas: number;
  faltas: number;
  total: number;
  frequencia: number;
  alunosUnicos: number;
  disciplinas: string[];
}

export function RelatorioConsolidado({
  chamadas,
  turmas,
  disciplinas,
  professor,
  dataInicio,
  dataFim,
}: RelatorioConsolidadoProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Consolidar dados por turma
  const turmasConsolidado = useMemo(() => {
    const turmasMap: Record<string, TurmaConsolidado> = {};

    chamadas.forEach(chamada => {
      const turma = turmas.find(t => t.id === chamada.turmaId);
      const turmaId = chamada.turmaId;

      if (!turmasMap[turmaId]) {
        turmasMap[turmaId] = {
          turmaId,
          turmaNome: turma?.nome || 'N/A',
          chamadas: 0,
          presencas: 0,
          faltas: 0,
          total: 0,
          frequencia: 0,
          alunosUnicos: 0,
          disciplinas: [],
        };
      }

      const t = turmasMap[turmaId];
      t.chamadas++;

      chamada.presencas.forEach(p => {
        t.total++;
        if (p.presente) {
          t.presencas++;
        } else {
          t.faltas++;
        }
      });

      // Adicionar disciplina se nao existir
      const disciplina = disciplinas.find(d => d.id === chamada.disciplinaId);
      if (disciplina && !t.disciplinas.includes(disciplina.nome)) {
        t.disciplinas.push(disciplina.nome);
      }
    });

    // Calcular frequencia e alunos unicos
    Object.values(turmasMap).forEach(t => {
      t.frequencia = t.total > 0 ? (t.presencas / t.total) * 100 : 0;
      // Estimar alunos unicos pelo maior numero de presencas em uma unica chamada
      const chamadasTurma = chamadas.filter(c => c.turmaId === t.turmaId);
      t.alunosUnicos = Math.max(...chamadasTurma.map(c => c.presencas.length), 0);
    });

    return Object.values(turmasMap).sort((a, b) => a.turmaNome.localeCompare(b.turmaNome));
  }, [chamadas, turmas, disciplinas]);

  // Estatisticas gerais
  const stats = useMemo(() => {
    const totalTurmas = turmasConsolidado.length;
    const totalChamadas = turmasConsolidado.reduce((acc, t) => acc + t.chamadas, 0);
    const totalPresencas = turmasConsolidado.reduce((acc, t) => acc + t.presencas, 0);
    const totalFaltas = turmasConsolidado.reduce((acc, t) => acc + t.faltas, 0);
    const total = totalPresencas + totalFaltas;
    const mediaFrequencia = total > 0 ? (totalPresencas / total) * 100 : 0;

    // Melhor e pior turma
    const melhorTurma = turmasConsolidado.length > 0
      ? turmasConsolidado.reduce((best, t) => t.frequencia > best.frequencia ? t : best)
      : null;
    const piorTurma = turmasConsolidado.length > 0
      ? turmasConsolidado.reduce((worst, t) => t.frequencia < worst.frequencia ? t : worst)
      : null;

    return {
      totalTurmas,
      totalChamadas,
      totalPresencas,
      totalFaltas,
      mediaFrequencia,
      melhorTurma,
      piorTurma,
    };
  }, [turmasConsolidado]);

  const handlePrint = () => {
    printReport({
      title: 'Relatorio Consolidado',
      professor: professor?.nome,
      periodo: formatPeriodo(dataInicio, dataFim),
      content: printRef.current?.innerHTML || '',
      showSignature: true,
    });
  };

  // Cor da frequencia
  const getFrequenciaColor = (freq: number): 'error' | 'warning' | 'success' => {
    if (freq < 75) return 'error';
    if (freq < 85) return 'warning';
    return 'success';
  };

  return (
    <Box>
      {/* Header com botao de impressao */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Periodo: {formatPeriodo(dataInicio, dataFim)}
        </Typography>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          size="small"
        >
          Imprimir
        </Button>
      </Box>

      {/* Cards de Resumo */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: 'primary.50' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <ClassIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h4" color="primary.main" fontWeight={600}>
                {stats.totalTurmas}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Turmas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: 'info.50' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <PeopleIcon color="info" sx={{ fontSize: 32 }} />
              <Typography variant="h4" color="info.main" fontWeight={600}>
                {stats.totalChamadas}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Chamadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: 'success.50' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <TrendingUpIcon color="success" sx={{ fontSize: 32 }} />
              <Typography variant="h4" color="success.main" fontWeight={600}>
                {stats.totalPresencas}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Presencas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: 'error.50' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <TrendingDownIcon color="error" sx={{ fontSize: 32 }} />
              <Typography variant="h4" color="error.main" fontWeight={600}>
                {stats.totalFaltas}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Faltas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Frequencia Media */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Frequencia Media Geral
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LinearProgress
            variant="determinate"
            value={stats.mediaFrequencia}
            color={getFrequenciaColor(stats.mediaFrequencia)}
            sx={{ flex: 1, height: 12, borderRadius: 6 }}
          />
          <Typography variant="h5" fontWeight={600} color={`${getFrequenciaColor(stats.mediaFrequencia)}.main`}>
            {stats.mediaFrequencia.toFixed(1)}%
          </Typography>
        </Box>

        {/* Destaques */}
        <Box sx={{ display: 'flex', gap: 4, mt: 2, flexWrap: 'wrap' }}>
          {stats.melhorTurma && (
            <Box>
              <Typography variant="caption" color="text.secondary">Melhor Frequencia:</Typography>
              <Typography variant="body2" color="success.main" fontWeight={600}>
                {stats.melhorTurma.turmaNome} ({stats.melhorTurma.frequencia.toFixed(1)}%)
              </Typography>
            </Box>
          )}
          {stats.piorTurma && stats.piorTurma !== stats.melhorTurma && (
            <Box>
              <Typography variant="caption" color="text.secondary">Menor Frequencia:</Typography>
              <Typography variant="body2" color="error.main" fontWeight={600}>
                {stats.piorTurma.turmaNome} ({stats.piorTurma.frequencia.toFixed(1)}%)
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Conteudo para impressao */}
      <Box ref={printRef}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Turma</TableCell>
                <TableCell align="center">Chamadas</TableCell>
                <TableCell align="center">Alunos</TableCell>
                <TableCell align="center">Presencas</TableCell>
                <TableCell align="center">Faltas</TableCell>
                <TableCell align="center" sx={{ minWidth: 150 }}>Frequencia</TableCell>
                <TableCell>Disciplinas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {turmasConsolidado.map((turma) => (
                <TableRow
                  key={turma.turmaId}
                  sx={{
                    bgcolor: turma.frequencia < 75 ? 'error.50' : turma.frequencia < 85 ? 'warning.50' : 'inherit',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {turma.turmaNome}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{turma.chamadas}</TableCell>
                  <TableCell align="center">{turma.alunosUnicos}</TableCell>
                  <TableCell align="center">
                    <Chip label={turma.presencas} color="success" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={turma.faltas} color="error" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={turma.frequencia}
                        color={getFrequenciaColor(turma.frequencia)}
                        sx={{ flex: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" sx={{ minWidth: 45 }}>
                        {turma.frequencia.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {turma.disciplinas.join(', ')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}

              {/* Linha de totais */}
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell><strong>TOTAL</strong></TableCell>
                <TableCell align="center"><strong>{stats.totalChamadas}</strong></TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="center"><strong>{stats.totalPresencas}</strong></TableCell>
                <TableCell align="center"><strong>{stats.totalFaltas}</strong></TableCell>
                <TableCell align="center">
                  <strong>{stats.mediaFrequencia.toFixed(1)}%</strong>
                </TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
