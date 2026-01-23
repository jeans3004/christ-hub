/**
 * Relatorio por Periodo - Resumo de chamadas em um periodo.
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
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario } from '@/types';
import { formatDate, formatPeriodo, printReport } from './utils';

interface RelatorioPeriodoProps {
  chamadas: Chamada[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  professor: Usuario | null;
  dataInicio: string;
  dataFim: string;
}

export function RelatorioPeriodo({
  chamadas,
  turmas,
  disciplinas,
  professor,
  dataInicio,
  dataFim,
}: RelatorioPeriodoProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Agrupar chamadas por data
  const chamadasPorData = useMemo(() => {
    const grouped: Record<string, Chamada[]> = {};

    chamadas.forEach(chamada => {
      const dataKey = chamada.data instanceof Date
        ? chamada.data.toISOString().split('T')[0]
        : new Date(chamada.data).toISOString().split('T')[0];

      if (!grouped[dataKey]) {
        grouped[dataKey] = [];
      }
      grouped[dataKey].push(chamada);
    });

    // Ordenar por data
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, chamadasDia]) => ({
        data,
        chamadas: chamadasDia,
        presentes: chamadasDia.reduce((acc, c) => acc + c.presencas.filter(p => p.presente).length, 0),
        ausentes: chamadasDia.reduce((acc, c) => acc + c.presencas.filter(p => !p.presente).length, 0),
        total: chamadasDia.reduce((acc, c) => acc + c.presencas.length, 0),
      }));
  }, [chamadas]);

  // Totais do periodo
  const totais = useMemo(() => {
    return chamadasPorData.reduce(
      (acc, dia) => ({
        chamadas: acc.chamadas + dia.chamadas.length,
        presentes: acc.presentes + dia.presentes,
        ausentes: acc.ausentes + dia.ausentes,
        total: acc.total + dia.total,
      }),
      { chamadas: 0, presentes: 0, ausentes: 0, total: 0 }
    );
  }, [chamadasPorData]);

  const handlePrint = () => {
    printReport({
      title: 'Relatorio por Periodo',
      professor: professor?.nome,
      periodo: formatPeriodo(dataInicio, dataFim),
      content: printRef.current?.innerHTML || '',
    });
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

      {/* Resumo Geral */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.50' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Resumo do Periodo - {professor?.nome}
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" color="info.main" fontWeight={600}>
              {chamadasPorData.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Dias com Aula
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="primary.main" fontWeight={600}>
              {totais.chamadas}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Chamadas
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="success.main" fontWeight={600}>
              {totais.presentes}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Presencas
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="error.main" fontWeight={600}>
              {totais.ausentes}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Faltas
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="text.secondary" fontWeight={600}>
              {totais.total > 0 ? ((totais.presentes / totais.total) * 100).toFixed(1) : 0}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Frequencia
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Conteudo para impressao */}
      <Box ref={printRef}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell align="center">Chamadas</TableCell>
                <TableCell align="center">Presentes</TableCell>
                <TableCell align="center">Ausentes</TableCell>
                <TableCell align="center">Total</TableCell>
                <TableCell align="center">Frequencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chamadasPorData.map((dia) => {
                const frequencia = dia.total > 0 ? ((dia.presentes / dia.total) * 100).toFixed(1) : '0';
                return (
                  <TableRow key={dia.data}>
                    <TableCell>{formatDate(dia.data)}</TableCell>
                    <TableCell align="center">{dia.chamadas.length}</TableCell>
                    <TableCell align="center">
                      <Chip label={dia.presentes} color="success" size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={dia.ausentes} color="error" size="small" />
                    </TableCell>
                    <TableCell align="center">{dia.total}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${frequencia}%`}
                        color={Number(frequencia) >= 75 ? 'success' : 'warning'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Linha de totais */}
              <TableRow sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>
                <TableCell><strong>TOTAL</strong></TableCell>
                <TableCell align="center"><strong>{totais.chamadas}</strong></TableCell>
                <TableCell align="center"><strong>{totais.presentes}</strong></TableCell>
                <TableCell align="center"><strong>{totais.ausentes}</strong></TableCell>
                <TableCell align="center"><strong>{totais.total}</strong></TableCell>
                <TableCell align="center">
                  <strong>
                    {totais.total > 0 ? ((totais.presentes / totais.total) * 100).toFixed(1) : 0}%
                  </strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Detalhes por turma */}
        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 4, mb: 2 }}>
          Detalhes por Turma/Disciplina
        </Typography>

        {chamadasPorData.map((dia) => (
          <Paper key={dia.data} sx={{ mb: 2, p: 2 }}>
            <Typography variant="subtitle2" color="primary.main" gutterBottom>
              {formatDate(dia.data)}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {dia.chamadas.map((chamada) => {
                const turma = turmas.find(t => t.id === chamada.turmaId);
                const disciplina = disciplinas.find(d => d.id === chamada.disciplinaId);
                const presentes = chamada.presencas.filter(p => p.presente).length;
                const ausentes = chamada.presencas.filter(p => !p.presente).length;

                return (
                  <Chip
                    key={chamada.id}
                    label={`${turma?.nome || '?'} - ${disciplina?.nome || '?'} (${presentes}P/${ausentes}F)`}
                    size="small"
                    variant="outlined"
                  />
                );
              })}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
