/**
 * Relatorio de Faltas - Alunos com mais faltas no periodo.
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
} from '@mui/material';
import { Print as PrintIcon, Warning as WarningIcon } from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario } from '@/types';
import { formatPeriodo, printReport } from './utils';

interface RelatorioFaltasProps {
  chamadas: Chamada[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  professor: Usuario | null;
  dataInicio: string;
  dataFim: string;
}

interface AlunoFaltas {
  alunoId: string;
  alunoNome: string;
  turmaId: string;
  turmaNome: string;
  faltas: number;
  presencas: number;
  total: number;
  frequencia: number;
  justificativas: string[];
}

export function RelatorioFaltas({
  chamadas,
  turmas,
  disciplinas,
  professor,
  dataInicio,
  dataFim,
}: RelatorioFaltasProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Calcular faltas por aluno
  const alunosFaltas = useMemo(() => {
    const alunosMap: Record<string, AlunoFaltas> = {};

    chamadas.forEach(chamada => {
      const turma = turmas.find(t => t.id === chamada.turmaId);

      chamada.presencas.forEach(presenca => {
        const key = `${presenca.alunoId}-${chamada.turmaId}`;

        if (!alunosMap[key]) {
          alunosMap[key] = {
            alunoId: presenca.alunoId,
            alunoNome: presenca.alunoNome,
            turmaId: chamada.turmaId,
            turmaNome: turma?.nome || 'N/A',
            faltas: 0,
            presencas: 0,
            total: 0,
            frequencia: 0,
            justificativas: [],
          };
        }

        alunosMap[key].total++;
        if (presenca.presente) {
          alunosMap[key].presencas++;
        } else {
          alunosMap[key].faltas++;
          if (presenca.justificativa) {
            alunosMap[key].justificativas.push(presenca.justificativa);
          }
        }
      });
    });

    // Calcular frequencia e ordenar por faltas (mais faltas primeiro)
    return Object.values(alunosMap)
      .map(aluno => ({
        ...aluno,
        frequencia: aluno.total > 0 ? (aluno.presencas / aluno.total) * 100 : 100,
      }))
      .filter(aluno => aluno.faltas > 0) // Apenas alunos com faltas
      .sort((a, b) => b.faltas - a.faltas);
  }, [chamadas, turmas]);

  // Estatisticas
  const stats = useMemo(() => {
    const totalAlunos = alunosFaltas.length;
    const alunosCriticos = alunosFaltas.filter(a => a.frequencia < 75).length;
    const alunosAlerta = alunosFaltas.filter(a => a.frequencia >= 75 && a.frequencia < 85).length;
    const totalFaltas = alunosFaltas.reduce((acc, a) => acc + a.faltas, 0);

    return { totalAlunos, alunosCriticos, alunosAlerta, totalFaltas };
  }, [alunosFaltas]);

  const handlePrint = () => {
    printReport({
      title: 'Relatorio de Faltas',
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

      {/* Alertas */}
      {stats.alunosCriticos > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.50', display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarningIcon color="error" />
          <Typography color="error.main">
            <strong>{stats.alunosCriticos}</strong> aluno(s) com frequencia abaixo de 75% (critico)
          </Typography>
        </Paper>
      )}

      {/* Resumo */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.50' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Resumo de Faltas - {professor?.nome}
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" color="warning.main" fontWeight={600}>
              {stats.totalAlunos}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Alunos com Faltas
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="error.main" fontWeight={600}>
              {stats.totalFaltas}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total de Faltas
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="error.dark" fontWeight={600}>
              {stats.alunosCriticos}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Freq. Critica (&lt;75%)
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="warning.dark" fontWeight={600}>
              {stats.alunosAlerta}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Freq. Alerta (75-85%)
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Conteudo para impressao */}
      <Box ref={printRef}>
        {alunosFaltas.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="success.main">
              Nenhuma falta registrada no periodo!
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Aluno</TableCell>
                  <TableCell>Turma</TableCell>
                  <TableCell align="center">Faltas</TableCell>
                  <TableCell align="center">Presencas</TableCell>
                  <TableCell align="center" sx={{ minWidth: 150 }}>Frequencia</TableCell>
                  <TableCell>Justificativas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alunosFaltas.map((aluno, index) => (
                  <TableRow
                    key={`${aluno.alunoId}-${aluno.turmaId}`}
                    sx={{
                      bgcolor: aluno.frequencia < 75 ? 'error.50' : aluno.frequencia < 85 ? 'warning.50' : 'inherit',
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={aluno.frequencia < 75 ? 600 : 400}>
                        {aluno.alunoNome}
                      </Typography>
                    </TableCell>
                    <TableCell>{aluno.turmaNome}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={aluno.faltas}
                        color="error"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={aluno.presencas}
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={aluno.frequencia}
                          color={getFrequenciaColor(aluno.frequencia)}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" sx={{ minWidth: 45 }}>
                          {aluno.frequencia.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {aluno.justificativas.length > 0
                          ? aluno.justificativas.slice(0, 2).join('; ') + (aluno.justificativas.length > 2 ? '...' : '')
                          : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Legenda */}
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label="Frequencia < 75% (Critico)" color="error" size="small" variant="outlined" />
          <Chip label="Frequencia 75-85% (Alerta)" color="warning" size="small" variant="outlined" />
          <Chip label="Frequencia >= 85% (OK)" color="success" size="small" variant="outlined" />
        </Box>
      </Box>
    </Box>
  );
}
