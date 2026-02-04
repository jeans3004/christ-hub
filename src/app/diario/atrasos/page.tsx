'use client';

/**
 * Pagina de Controle de Atrasos
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useFilterStore } from '@/store/filterStore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { useTurmas, useAlunosByTurma } from '@/hooks';
import { atrasoService } from '@/services/firestore/atrasoService';
import { Atraso, Aluno } from '@/types';

export default function AtrasosPage() {
  const { ano } = useFilterStore();
  const { addToast } = useUIStore();
  const { usuario } = useAuth();
  const { turmas } = useTurmas(ano);

  // Filtros
  const [filtroTurma, setFiltroTurma] = useState('');
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0]);

  // Dados
  const [atrasos, setAtrasos] = useState<Atraso[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal de novo atraso
  const [modalOpen, setModalOpen] = useState(false);
  const [turmaId, setTurmaId] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [horarioChegada, setHorarioChegada] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [saving, setSaving] = useState(false);

  // Alunos da turma selecionada no modal
  const { alunos } = useAlunosByTurma(turmaId || null);

  // Confirmacao de exclusao
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    atrasoId: '',
  });

  // Carregar atrasos
  const loadAtrasos = useCallback(async () => {
    setLoading(true);
    try {
      let data: Atraso[];
      if (filtroTurma) {
        data = await atrasoService.getByTurmaData(filtroTurma, new Date(filtroData + 'T12:00:00'));
      } else {
        data = await atrasoService.getByData(new Date(filtroData + 'T12:00:00'));
      }
      setAtrasos(data);
    } catch (error) {
      console.error('Erro ao carregar atrasos:', error);
      addToast('Erro ao carregar atrasos', 'error');
    } finally {
      setLoading(false);
    }
  }, [filtroTurma, filtroData, addToast]);

  useEffect(() => {
    loadAtrasos();
  }, [loadAtrasos]);

  // Calcular tempo de atraso baseado no turno da turma
  const calcularTempoAtraso = (horario: string, turmaIdCalc: string): number => {
    const turma = turmas.find(t => t.id === turmaIdCalc);
    const [hours, minutes] = horario.split(':').map(Number);
    const chegadaMinutos = hours * 60 + minutes;

    // Horario de inicio das aulas
    let inicioAula = 7 * 60; // 7:00 - matutino
    if (turma?.turno === 'Vespertino') {
      inicioAula = 13 * 60; // 13:00 - vespertino
    } else if (turma?.turno === 'Noturno') {
      inicioAula = 19 * 60; // 19:00 - noturno
    }

    return Math.max(0, chegadaMinutos - inicioAula);
  };

  // Salvar novo atraso
  const handleSave = async () => {
    if (!turmaId || !alunoSelecionado || !horarioChegada || !usuario) {
      addToast('Preencha todos os campos obrigatorios', 'error');
      return;
    }

    setSaving(true);
    try {
      const turma = turmas.find(t => t.id === turmaId);
      const tempoAtraso = calcularTempoAtraso(horarioChegada, turmaId);

      await atrasoService.create({
        alunoId: alunoSelecionado.id,
        alunoNome: alunoSelecionado.nome,
        turmaId,
        turmaNome: turma?.nome || '',
        data: new Date(filtroData + 'T12:00:00'),
        horarioChegada,
        tempoAtraso,
        justificativa: justificativa || undefined,
        registradoPorId: usuario.id,
        registradoPorNome: usuario.nome,
      });

      addToast('Atraso registrado com sucesso!', 'success');
      setModalOpen(false);
      resetForm();
      loadAtrasos();
    } catch (error) {
      console.error('Erro ao salvar atraso:', error);
      addToast('Erro ao registrar atraso', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Deletar atraso
  const handleDelete = async () => {
    try {
      await atrasoService.delete(confirmDialog.atrasoId);
      addToast('Atraso removido com sucesso!', 'success');
      setConfirmDialog({ open: false, atrasoId: '' });
      loadAtrasos();
    } catch (error) {
      console.error('Erro ao deletar atraso:', error);
      addToast('Erro ao remover atraso', 'error');
    }
  };

  const resetForm = () => {
    setTurmaId('');
    setAlunoSelecionado(null);
    setHorarioChegada('');
    setJustificativa('');
  };

  const formatMinutos = (minutos: number): string => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h > 0) {
      return `${h}h ${m}min`;
    }
    return `${m}min`;
  };

  return (
    <MainLayout title="Controle de Atrasos">
      <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
        {/* Filtros */}
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <FilterIcon color="action" />
            <TextField
              label="Data"
              type="date"
              size="small"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Turma</InputLabel>
              <Select
                value={filtroTurma}
                label="Turma"
                onChange={(e) => setFiltroTurma(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {turmas.map((turma) => (
                  <MenuItem key={turma.id} value={turma.id}>
                    {turma.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalOpen(true)}
            >
              Registrar Atraso
            </Button>
          </Stack>
        </Paper>

        {/* Lista de atrasos */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Atrasos do dia {new Date(filtroData + 'T12:00:00').toLocaleDateString('pt-BR')}
          </Typography>

          {loading ? (
            <Typography color="text.secondary">Carregando...</Typography>
          ) : atrasos.length === 0 ? (
            <Typography color="text.secondary">
              Nenhum atraso registrado para esta data.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Aluno</TableCell>
                    <TableCell>Turma</TableCell>
                    <TableCell>Chegada</TableCell>
                    <TableCell>Atraso</TableCell>
                    <TableCell>Justificativa</TableCell>
                    <TableCell>Registrado por</TableCell>
                    <TableCell width={60} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {atrasos.map((atraso) => (
                    <TableRow key={atraso.id} hover>
                      <TableCell>{atraso.alunoNome}</TableCell>
                      <TableCell>{atraso.turmaNome}</TableCell>
                      <TableCell>{atraso.horarioChegada}</TableCell>
                      <TableCell>
                        <Chip
                          label={formatMinutos(atraso.tempoAtraso)}
                          size="small"
                          color={atraso.tempoAtraso > 15 ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>{atraso.justificativa || '-'}</TableCell>
                      <TableCell>{atraso.registradoPorNome}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmDialog({ open: true, atrasoId: atraso.id })}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* Modal de novo atraso */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Atraso</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Turma</InputLabel>
              <Select
                value={turmaId}
                label="Turma"
                onChange={(e) => {
                  setTurmaId(e.target.value);
                  setAlunoSelecionado(null);
                }}
              >
                {turmas.map((turma) => (
                  <MenuItem key={turma.id} value={turma.id}>
                    {turma.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              options={alunos}
              getOptionLabel={(aluno) => aluno.nome}
              value={alunoSelecionado}
              onChange={(_, newValue) => setAlunoSelecionado(newValue)}
              disabled={!turmaId}
              renderInput={(params) => (
                <TextField {...params} label="Aluno" placeholder="Selecione o aluno" />
              )}
            />

            <TextField
              label="Horario de Chegada"
              type="time"
              value={horarioChegada}
              onChange={(e) => setHorarioChegada(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            {horarioChegada && turmaId && (
              <Typography variant="body2" color="text.secondary">
                Tempo de atraso: {formatMinutos(calcularTempoAtraso(horarioChegada, turmaId))}
              </Typography>
            )}

            <TextField
              label="Justificativa (opcional)"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmacao de exclusao */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, atrasoId: '' })}
        onConfirm={handleDelete}
        title="Remover Atraso"
        message="Tem certeza que deseja remover este registro de atraso?"
      />
    </MainLayout>
  );
}
