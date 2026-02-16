/**
 * Relatorio do Dia - Lista de chamadas do dia com acesso ao detalhe.
 */

import { useState, useRef, useEffect } from 'react';
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
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario, EAlunoConfig } from '@/types';
import { chamadaService, eAlunoConfigService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
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
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; chamadaId: string }>({ open: false, chamadaId: '' });
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useUIStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [eAlunoConfig, setEAlunoConfig] = useState<EAlunoConfig | null>(null);

  // Load eAluno config for SGE URLs
  useEffect(() => {
    if (professor?.id) {
      eAlunoConfigService.getByUser(professor.id).then(setEAlunoConfig).catch(() => {});
    }
  }, [professor?.id]);

  // Build dynamic SGE URL per chamada
  const getSgeUrl = (chamada: Chamada) => {
    const base = 'https://e-aluno.com.br/christ/diario/relatorio_diario.php';
    const turmaMapping = eAlunoConfig?.turmaMap?.[chamada.turmaId];
    const disciplinaMapping = eAlunoConfig?.disciplinaMap?.[chamada.disciplinaId];
    if (!turmaMapping || !disciplinaMapping) return base;

    const turmaObj = turmas.find(t => t.id === chamada.turmaId);
    const params = new URLSearchParams({
      serie: String(turmaMapping.serie),
      turma: String(turmaMapping.turma),
      turno: turmaMapping.turno,
      disciplina: String(disciplinaMapping),
      data,
      txtSerie: turmaObj?.nome || '',
      ano: String(new Date(data + 'T12:00:00').getFullYear()),
    });
    return `${base}?${params.toString()}`;
  };

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
          <td style="text-align: center">${chamada.sgeSyncedAt ? 'Sim' : 'Nao'}</td>
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
            <th style="width: 80px; text-align: center">SGE</th>
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

  const handleDelete = async () => {
    if (!confirmDelete.chamadaId) return;
    setDeleting(true);
    try {
      await chamadaService.delete(confirmDelete.chamadaId);
      setChamadas(prev => prev.filter(c => c.id !== confirmDelete.chamadaId));
      // Se estava no detalhe, volta para lista
      if (selectedChamada?.id === confirmDelete.chamadaId) {
        setSelectedChamada(null);
      }
      addToast('Chamada excluida com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao excluir chamada:', error);
      addToast('Erro ao excluir chamada', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete({ open: false, chamadaId: '' });
    }
  };

  // Se uma chamada esta selecionada, mostra o detalhe
  if (selectedChamada) {
    const turma = turmas.find(t => t.id === selectedChamada.turmaId);
    const disciplina = disciplinas.find(d => d.id === selectedChamada.disciplinaId);

    return (
      <>
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
          onDelete={(chamadaId) => setConfirmDelete({ open: true, chamadaId })}
        />
        <ConfirmDialog
          open={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, chamadaId: '' })}
          onConfirm={handleDelete}
          title="Excluir Chamada"
          message="Tem certeza que deseja excluir esta chamada? Esta acao nao pode ser desfeita."
          confirmLabel="Excluir"
          confirmColor="error"
          loading={deleting}
        />
      </>
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
                <TableCell align="center" sx={{ width: 120 }}>SGE</TableCell>
                <TableCell align="center" sx={{ width: 60 }}>Ver SGE</TableCell>
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
                    <TableCell align="center">
                      <Chip
                        label={chamada.sgeSyncedAt ? 'Sincronizado' : 'Pendente'}
                        size="small"
                        color={chamada.sgeSyncedAt ? 'success' : 'default'}
                        variant={chamada.sgeSyncedAt ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(getSgeUrl(chamada), '_blank');
                        }}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete({ open: true, chamadaId: chamada.id });
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <ChevronRight />
                        </IconButton>
                      </Box>
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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, chamadaId: '' })}
        onConfirm={handleDelete}
        title="Excluir Chamada"
        message="Tem certeza que deseja excluir esta chamada? Esta acao nao pode ser desfeita."
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
      />
    </Box>
  );
}
