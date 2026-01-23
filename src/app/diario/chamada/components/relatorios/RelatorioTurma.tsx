/**
 * Relatorio por Turma - Historico de chamadas de uma turma especifica.
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
  Divider,
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario } from '@/types';
import { formatDate, formatPeriodo, printReport } from './utils';

interface RelatorioTurmaProps {
  chamadas: Chamada[];
  turma: Turma | null;
  disciplinas: Disciplina[];
  professor: Usuario | null;
  dataInicio: string;
  dataFim: string;
}

interface AlunoHistorico {
  alunoId: string;
  alunoNome: string;
  presencas: number;
  faltas: number;
  total: number;
  frequencia: number;
  historicoPorData: Record<string, boolean>; // data -> presente
}

export function RelatorioTurma({
  chamadas,
  turma,
  disciplinas,
  professor,
  dataInicio,
  dataFim,
}: RelatorioTurmaProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Obter datas unicas ordenadas
  const datas = useMemo(() => {
    const datasSet = new Set<string>();
    chamadas.forEach(chamada => {
      const dataKey = chamada.data instanceof Date
        ? chamada.data.toISOString().split('T')[0]
        : new Date(chamada.data).toISOString().split('T')[0];
      datasSet.add(dataKey);
    });
    return Array.from(datasSet).sort();
  }, [chamadas]);

  // Calcular historico por aluno
  const alunosHistorico = useMemo(() => {
    const alunosMap: Record<string, AlunoHistorico> = {};

    chamadas.forEach(chamada => {
      const dataKey = chamada.data instanceof Date
        ? chamada.data.toISOString().split('T')[0]
        : new Date(chamada.data).toISOString().split('T')[0];

      chamada.presencas.forEach(presenca => {
        if (!alunosMap[presenca.alunoId]) {
          alunosMap[presenca.alunoId] = {
            alunoId: presenca.alunoId,
            alunoNome: presenca.alunoNome,
            presencas: 0,
            faltas: 0,
            total: 0,
            frequencia: 0,
            historicoPorData: {},
          };
        }

        const aluno = alunosMap[presenca.alunoId];
        aluno.total++;
        aluno.historicoPorData[dataKey] = presenca.presente;

        if (presenca.presente) {
          aluno.presencas++;
        } else {
          aluno.faltas++;
        }
      });
    });

    // Calcular frequencia e ordenar por nome
    return Object.values(alunosMap)
      .map(aluno => ({
        ...aluno,
        frequencia: aluno.total > 0 ? (aluno.presencas / aluno.total) * 100 : 100,
      }))
      .sort((a, b) => a.alunoNome.localeCompare(b.alunoNome));
  }, [chamadas]);

  // Estatisticas gerais
  const stats = useMemo(() => {
    const totalAlunos = alunosHistorico.length;
    const totalPresencas = alunosHistorico.reduce((acc, a) => acc + a.presencas, 0);
    const totalFaltas = alunosHistorico.reduce((acc, a) => acc + a.faltas, 0);
    const mediaFrequencia = totalAlunos > 0
      ? alunosHistorico.reduce((acc, a) => acc + a.frequencia, 0) / totalAlunos
      : 0;

    return { totalAlunos, totalPresencas, totalFaltas, mediaFrequencia };
  }, [alunosHistorico]);

  const handlePrint = () => {
    printReport({
      title: `Relatorio da Turma: ${turma?.nome || 'N/A'}`,
      professor: professor?.nome,
      periodo: formatPeriodo(dataInicio, dataFim),
      content: printRef.current?.innerHTML || '',
    });
  };

  // Cor da frequencia
  const getFrequenciaColor = (freq: number): 'error' | 'warning' | 'success' => {
    if (freq < 75) return 'error';
    if (freq < 85) return 'warning';
    return 'success';
  };

  if (!turma) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Selecione uma turma para gerar o relatorio.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header com botao de impressao */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6">
            {turma.nome}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatPeriodo(dataInicio, dataFim)}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          size="small"
        >
          Imprimir
        </Button>
      </Box>

      {/* Resumo */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.50' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Resumo da Turma
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" color="primary.main" fontWeight={600}>
              {stats.totalAlunos}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Alunos
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="info.main" fontWeight={600}>
              {datas.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Dias de Aula
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="success.main" fontWeight={600}>
              {stats.totalPresencas}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Presencas
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="error.main" fontWeight={600}>
              {stats.totalFaltas}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Faltas
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color={getFrequenciaColor(stats.mediaFrequencia) + '.main'} fontWeight={600}>
              {stats.mediaFrequencia.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Freq. Media
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Conteudo para impressao */}
      <Box ref={printRef}>
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 50, position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>#</TableCell>
                <TableCell sx={{ minWidth: 180, position: 'sticky', left: 50, bgcolor: 'background.paper', zIndex: 1 }}>Aluno</TableCell>
                {datas.map(data => (
                  <TableCell key={data} align="center" sx={{ minWidth: 45, fontSize: '0.65rem', px: 0.5 }}>
                    {formatDate(data).substring(0, 5)}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ minWidth: 60 }}>P</TableCell>
                <TableCell align="center" sx={{ minWidth: 60 }}>F</TableCell>
                <TableCell align="center" sx={{ minWidth: 80 }}>Freq.</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alunosHistorico.map((aluno, index) => (
                <TableRow
                  key={aluno.alunoId}
                  sx={{
                    bgcolor: aluno.frequencia < 75 ? 'error.50' : 'inherit',
                  }}
                >
                  <TableCell sx={{ position: 'sticky', left: 0, bgcolor: aluno.frequencia < 75 ? 'error.50' : 'background.paper' }}>
                    {String(index + 1).padStart(2, '0')}
                  </TableCell>
                  <TableCell sx={{ position: 'sticky', left: 50, bgcolor: aluno.frequencia < 75 ? 'error.50' : 'background.paper' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {aluno.alunoNome}
                    </Typography>
                  </TableCell>
                  {datas.map(data => {
                    const presente = aluno.historicoPorData[data];
                    return (
                      <TableCell key={data} align="center" sx={{ px: 0.5 }}>
                        {presente === undefined ? (
                          <Typography variant="caption" color="text.disabled">-</Typography>
                        ) : presente ? (
                          <Chip label="P" size="small" color="success" sx={{ height: 20, fontSize: '0.6rem' }} />
                        ) : (
                          <Chip label="F" size="small" color="error" sx={{ height: 20, fontSize: '0.6rem' }} />
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell align="center">
                    <strong>{aluno.presencas}</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>{aluno.faltas}</strong>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${aluno.frequencia.toFixed(0)}%`}
                      color={getFrequenciaColor(aluno.frequencia)}
                      size="small"
                      sx={{ minWidth: 50 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Disciplinas trabalhadas */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Disciplinas trabalhadas no periodo:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Array.from(new Set(chamadas.map(c => c.disciplinaId))).map(disciplinaId => {
              const disciplina = disciplinas.find(d => d.id === disciplinaId);
              const count = chamadas.filter(c => c.disciplinaId === disciplinaId).length;
              return (
                <Chip
                  key={disciplinaId}
                  label={`${disciplina?.nome || '?'} (${count})`}
                  size="small"
                  variant="outlined"
                />
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
