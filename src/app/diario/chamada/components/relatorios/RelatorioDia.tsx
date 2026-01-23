/**
 * Relatorio do Dia - Espelho da chamada de um dia especifico.
 */

import { useRef } from 'react';
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
  Chip,
  Divider,
  Button,
} from '@mui/material';
import {
  Print as PrintIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
} from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario } from '@/types';
import { formatDate, formatDateFull, printReport } from './utils';

interface RelatorioDiaProps {
  chamadas: Chamada[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  professor: Usuario | null;
  data: string;
}

export function RelatorioDia({
  chamadas,
  turmas,
  disciplinas,
  professor,
  data,
}: RelatorioDiaProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Calcular totais gerais
  const totaisGerais = chamadas.reduce(
    (acc, chamada) => {
      const presentes = chamada.presencas.filter(p => p.presente).length;
      const ausentes = chamada.presencas.filter(p => !p.presente).length;
      return {
        presentes: acc.presentes + presentes,
        ausentes: acc.ausentes + ausentes,
        total: acc.total + chamada.presencas.length,
      };
    },
    { presentes: 0, ausentes: 0, total: 0 }
  );

  const handlePrint = () => {
    printReport({
      title: 'Espelho da Chamada',
      subtitle: formatDateFull(data),
      professor: professor?.nome || 'N/A',
      content: printRef.current?.innerHTML || '',
    });
  };

  return (
    <Box>
      {/* Header com botao de impressao */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          {formatDateFull(data)}
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
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Resumo do Dia - {professor?.nome}
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" color="primary.main" fontWeight={600}>
              {chamadas.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {chamadas.length === 1 ? 'Chamada' : 'Chamadas'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="success.main" fontWeight={600}>
              {totaisGerais.presentes}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Presencas
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="error.main" fontWeight={600}>
              {totaisGerais.ausentes}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Faltas
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Conteudo para impressao */}
      <Box ref={printRef}>
        {chamadas.map((chamada) => {
          const turma = turmas.find(t => t.id === chamada.turmaId);
          const disciplina = disciplinas.find(d => d.id === chamada.disciplinaId);
          const presentes = chamada.presencas.filter(p => p.presente);
          const ausentes = chamada.presencas.filter(p => !p.presente);

          return (
            <Paper key={chamada.id} sx={{ mb: 3, overflow: 'hidden' }} className="chamada-section">
              {/* Cabecalho da Turma */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
                className="section-header"
              >
                <Typography variant="subtitle1" fontWeight={600} className="section-title">
                  {turma?.nome || 'Turma N/A'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }} className="section-subtitle">
                  {disciplina?.nome || 'Disciplina N/A'} - {chamada.tempo}o Tempo
                </Typography>
              </Box>

              {/* Estatisticas */}
              <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }} className="stats">
                <Chip
                  icon={<PresentIcon />}
                  label={`${presentes.length} Presentes`}
                  color="success"
                  size="small"
                />
                <Chip
                  icon={<AbsentIcon />}
                  label={`${ausentes.length} Ausentes`}
                  color="error"
                  size="small"
                />
                <Chip
                  label={`${chamada.presencas.length} Total`}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Divider />

              {/* Lista de Alunos */}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 50 }}>#</TableCell>
                      <TableCell>Aluno</TableCell>
                      <TableCell sx={{ width: 100 }} align="center">Status</TableCell>
                      <TableCell>Observacao</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {chamada.presencas.map((presenca, idx) => (
                      <TableRow
                        key={presenca.alunoId}
                        sx={{
                          bgcolor: presenca.presente ? 'inherit' : 'error.50',
                        }}
                      >
                        <TableCell>{String(idx + 1).padStart(2, '0')}</TableCell>
                        <TableCell>{presenca.alunoNome}</TableCell>
                        <TableCell align="center">
                          {presenca.presente ? (
                            <Chip
                              label="P"
                              size="small"
                              color="success"
                              sx={{ minWidth: 40 }}
                              className="presente"
                            />
                          ) : (
                            <Chip
                              label="F"
                              size="small"
                              color="error"
                              sx={{ minWidth: 40 }}
                              className="ausente"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {presenca.justificativa || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Conteudo Ministrado */}
              {chamada.conteudo && (
                <Box sx={{ p: 2, bgcolor: 'warning.50' }} className="conteudo">
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Conteudo Ministrado:
                  </Typography>
                  <Typography variant="body2">
                    {chamada.conteudo}
                  </Typography>
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
