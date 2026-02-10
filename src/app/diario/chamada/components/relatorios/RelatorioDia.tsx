/**
 * Relatorio do Dia - Lista de chamadas do dia com acesso ao detalhe.
 */

import { useState, useRef } from 'react';
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
  Button,
  IconButton,
} from '@mui/material';
import {
  Print as PrintIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  ChevronRight,
} from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario } from '@/types';
import { formatDate, formatDateFull, formatTime, printReport } from './utils';
import { ChamadaDetalhe } from './ChamadaDetalhe';

interface RelatorioDiaProps {
  chamadas: Chamada[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  professor: Usuario | null;
  data: string;
  onChamadaUpdate?: (updatedChamada: Chamada) => void;
}

export function RelatorioDia({
  chamadas: initialChamadas,
  turmas,
  disciplinas,
  professor,
  data,
  onChamadaUpdate,
}: RelatorioDiaProps) {
  const [chamadas, setChamadas] = useState(
    [...initialChamadas].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return a.tempo - b.tempo;
    })
  );
  const [selectedChamada, setSelectedChamada] = useState<Chamada | null>(null);
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
    const tableRows = chamadas.map((chamada, idx) => {
      const turma = turmas.find(t => t.id === chamada.turmaId);
      const disciplina = disciplinas.find(d => d.id === chamada.disciplinaId);
      const presentes = chamada.presencas.filter(p => p.presente).length;
      const ausentes = chamada.presencas.filter(p => !p.presente).length;

      return `
        <tr>
          <td style="text-align: center">${idx + 1}</td>
          <td>${turma?.nome || 'N/A'}</td>
          <td>${disciplina?.nome || 'N/A'}</td>
          <td style="text-align: center">${formatTime(chamada.createdAt) || chamada.tempo + 'o'}</td>
          <td style="text-align: center" class="presente">${presentes}</td>
          <td style="text-align: center" class="ausente">${ausentes}</td>
          <td style="text-align: center">${chamada.presencas.length}</td>
        </tr>
      `;
    }).join('');

    const content = `
      <div class="summary-box">
        <div class="summary-title">Resumo do Dia</div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">${chamadas.length}</div>
            <div class="summary-label">Chamadas</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: green">${totaisGerais.presentes}</div>
            <div class="summary-label">Presencas</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: red">${totaisGerais.ausentes}</div>
            <div class="summary-label">Faltas</div>
          </div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center">N\u00BA</th>
            <th>Turma</th>
            <th>Disciplina</th>
            <th style="width: 80px; text-align: center">Horario</th>
            <th style="width: 80px; text-align: center">Presentes</th>
            <th style="width: 80px; text-align: center">Ausentes</th>
            <th style="width: 80px; text-align: center">Total</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;

    printReport({
      title: 'Espelho da Chamada',
      subtitle: formatDateFull(data),
      professor: professor?.nome || 'N/A',
      content,
    });
  };

  const handleChamadaUpdate = (updatedChamada: Chamada) => {
    setChamadas(prev => prev.map(c => c.id === updatedChamada.id ? updatedChamada : c));
    onChamadaUpdate?.(updatedChamada);
  };

  // Se uma chamada esta selecionada, mostra o detalhe
  if (selectedChamada) {
    const turma = turmas.find(t => t.id === selectedChamada.turmaId);
    const disciplina = disciplinas.find(d => d.id === selectedChamada.disciplinaId);

    return (
      <ChamadaDetalhe
        chamada={selectedChamada}
        turma={turma}
        disciplina={disciplina}
        professor={professor}
        data={data}
        onBack={() => setSelectedChamada(null)}
        onUpdate={(updated) => {
          handleChamadaUpdate(updated);
          setSelectedChamada(updated);
        }}
      />
    );
  }

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

      {/* Lista de Chamadas */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ width: 50 }} align="center">N&ordm;</TableCell>
                <TableCell>Turma</TableCell>
                <TableCell>Disciplina</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>Horario</TableCell>
                <TableCell align="center" sx={{ width: 100 }}>Presentes</TableCell>
                <TableCell align="center" sx={{ width: 100 }}>Ausentes</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>Total</TableCell>
                <TableCell sx={{ width: 50 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chamadas.map((chamada, idx) => {
                const turma = turmas.find(t => t.id === chamada.turmaId);
                const disciplina = disciplinas.find(d => d.id === chamada.disciplinaId);
                const presentes = chamada.presencas.filter(p => p.presente).length;
                const ausentes = chamada.presencas.filter(p => !p.presente).length;

                return (
                  <TableRow
                    key={chamada.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelectedChamada(chamada)}
                  >
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {idx + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {turma?.nome || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {disciplina?.nome || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={formatTime(chamada.createdAt) || `${chamada.tempo}o`} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={<PresentIcon sx={{ fontSize: 16 }} />}
                        label={presentes}
                        size="small"
                        color="success"
                        sx={{ minWidth: 60 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={<AbsentIcon sx={{ fontSize: 16 }} />}
                        label={ausentes}
                        size="small"
                        color="error"
                        sx={{ minWidth: 60 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={500}>
                        {chamada.presencas.length}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <ChevronRight />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dica */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        Clique em uma chamada para visualizar detalhes e editar
      </Typography>
    </Box>
  );
}
