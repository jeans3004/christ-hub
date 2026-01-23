/**
 * Componente de Espelho da Chamada - relatorio de presencas do dia.
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
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Print as PrintIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario } from '@/types';

interface EspelhoChamadaProps {
  chamadas: Chamada[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  professor: Usuario | null;
  data: string;
  loading: boolean;
  onClose: () => void;
}

// Formatar data para exibicao
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Formatar data completa
function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const dias = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];
  const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return `${dias[date.getDay()]}, ${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
}

export function EspelhoChamada({
  chamadas,
  turmas,
  disciplinas,
  professor,
  data,
  loading,
  onClose,
}: EspelhoChamadaProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; margin-bottom: 5px; }
        h2 { text-align: center; color: #666; margin-top: 0; }
        .header-info { text-align: center; margin-bottom: 20px; color: #333; }
        .chamada-section { margin-bottom: 30px; page-break-inside: avoid; }
        .section-header { background: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
        .section-title { font-weight: bold; font-size: 16px; }
        .section-subtitle { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f9f9f9; font-weight: bold; }
        .presente { color: green; }
        .ausente { color: red; }
        .stats { margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 4px; }
        .conteudo { margin-top: 10px; padding: 10px; background: #fff9c4; border-radius: 4px; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        .signature-line { margin-top: 60px; border-top: 1px solid #000; width: 300px; margin-left: auto; margin-right: auto; }
        .signature-label { text-align: center; margin-top: 5px; }
        @media print { body { padding: 0; } }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Espelho da Chamada - ${formatDate(data)}</title>
          ${styles}
        </head>
        <body>
          <h1>Centro de Educacao Integral Christ Master</h1>
          <h2>Espelho da Chamada</h2>
          <div class="header-info">
            <strong>Professor(a):</strong> ${professor?.nome || 'N/A'}<br>
            <strong>Data:</strong> ${formatDateFull(data)}
          </div>
          ${printContent.innerHTML}
          <div class="signature-line"></div>
          <div class="signature-label">Assinatura do Professor(a)</div>
          <div class="footer">
            Documento gerado em ${new Date().toLocaleString('pt-BR')}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (chamadas.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Espelho da Chamada</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Alert severity="info">
          Nenhuma chamada registrada para {professor?.nome || 'este professor'} em {formatDate(data)}.
        </Alert>
      </Box>
    );
  }

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

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Espelho da Chamada
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDateFull(data)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            size="small"
          >
            Imprimir
          </Button>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
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
        {chamadas.map((chamada, index) => {
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
