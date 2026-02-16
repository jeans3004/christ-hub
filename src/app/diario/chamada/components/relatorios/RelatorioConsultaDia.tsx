/**
 * Relatorio Consultar Dia - Espelha "Detalhamento da chamada" do SGE.
 * Mostra presenca por aluno com comparacao SGE e edicao inline.
 */

import { useState, useCallback, useEffect } from 'react';
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
  Checkbox,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  Sync as SyncIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario, EAlunoConfig } from '@/types';
import { chamadaService, eAlunoConfigService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';
import { formatDateFull } from './utils';

interface RelatorioConsultaDiaProps {
  turmaId: string;
  disciplinaId: string;
  data: string;
  turmas: Turma[];
  disciplinas: Disciplina[];
  professor: Usuario | null;
}

interface SgeStudentStatus {
  alunoId: string;
  status: 'ok' | 'divergente' | 'nao_encontrado';
  sgePresenteLabel?: string;
}

export function RelatorioConsultaDia({
  turmaId,
  disciplinaId,
  data,
  turmas,
  disciplinas,
  professor,
}: RelatorioConsultaDiaProps) {
  const { addToast } = useUIStore();
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sgeStatus, setSgeStatus] = useState<Record<string, SgeStudentStatus>>({});
  const [checkingSge, setCheckingSge] = useState(false);
  const [editedPresencas, setEditedPresencas] = useState<Record<string, Record<string, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [eAlunoConfig, setEAlunoConfig] = useState<EAlunoConfig | null>(null);

  const turma = turmas.find(t => t.id === turmaId);
  const disciplina = disciplinas.find(d => d.id === disciplinaId);

  // Load eAluno config for SGE URLs
  useEffect(() => {
    if (professor?.id) {
      eAlunoConfigService.getByUser(professor.id).then(setEAlunoConfig).catch(() => {});
    }
  }, [professor?.id]);

  // Load chamadas for turma+disciplina+data
  const loadChamadas = useCallback(async () => {
    if (!turmaId || !disciplinaId || !data) return;
    setLoading(true);
    try {
      const all = await chamadaService.getByTurmaData(
        turmaId,
        new Date(data + 'T12:00:00')
      );
      const filtered = all.filter(c => c.disciplinaId === disciplinaId);
      setChamadas(filtered.sort((a, b) => a.tempo - b.tempo));
      setLoaded(true);
      setSgeStatus({});
      setEditedPresencas({});
    } catch (error) {
      console.error('Erro ao carregar chamadas:', error);
      addToast('Erro ao carregar chamadas', 'error');
    } finally {
      setLoading(false);
    }
  }, [turmaId, disciplinaId, data, addToast]);

  // Check SGE status per student
  const handleVerificarSge = useCallback(async () => {
    if (!professor?.id || chamadas.length === 0) return;

    setCheckingSge(true);
    try {
      const config: EAlunoConfig | null = await eAlunoConfigService.getByUser(professor.id);
      if (!config?.credentials?.user || !config?.credentials?.password) {
        addToast('Configure suas credenciais do e-aluno primeiro', 'warning');
        return;
      }

      const turmaMapping = config.turmaMap?.[turmaId];
      const disciplinaMapping = config.disciplinaMap?.[disciplinaId];

      if (!turmaMapping || !disciplinaMapping) {
        addToast('Mapeamento de turma/disciplina nao encontrado. Configure no SGE primeiro.', 'warning');
        return;
      }

      const newStatus: Record<string, SgeStudentStatus> = {};

      for (const chamada of chamadas) {
        const res = await fetch('/api/ealuno/chamada-detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: config.credentials.user,
            password: config.credentials.password,
            encrypted: true,
            serie: turmaMapping.serie,
            turma: turmaMapping.turma,
            turno: turmaMapping.turno,
            disciplina: disciplinaMapping,
            ano: new Date(data + 'T12:00:00').getFullYear(),
            data,
            aula: chamada.tempo,
          }),
        });

        if (!res.ok) continue;
        const json = await res.json();
        if (!json.success) continue;

        const sgeStudents: Array<{ id: number; nome: string; presente: boolean }> = json.data.students;

        for (const presenca of chamada.presencas) {
          const eAlunoId = config.alunoMap?.[presenca.alunoId];
          if (!eAlunoId) {
            newStatus[`${chamada.id}:${presenca.alunoId}`] = {
              alunoId: presenca.alunoId,
              status: 'nao_encontrado',
            };
            continue;
          }

          const sgeStudent = sgeStudents.find(s => s.id === eAlunoId);
          if (!sgeStudent) {
            newStatus[`${chamada.id}:${presenca.alunoId}`] = {
              alunoId: presenca.alunoId,
              status: 'nao_encontrado',
            };
            continue;
          }

          const match = presenca.presente === sgeStudent.presente;
          newStatus[`${chamada.id}:${presenca.alunoId}`] = {
            alunoId: presenca.alunoId,
            status: match ? 'ok' : 'divergente',
            sgePresenteLabel: sgeStudent.presente ? 'P' : 'F',
          };
        }
      }

      setSgeStatus(newStatus);
      addToast('Verificacao SGE concluida', 'success');
    } catch (error) {
      console.error('Erro ao verificar SGE:', error);
      addToast('Erro ao verificar SGE', 'error');
    } finally {
      setCheckingSge(false);
    }
  }, [professor?.id, chamadas, turmaId, disciplinaId, data, addToast]);

  // Toggle presence
  const handleTogglePresenca = (chamadaId: string, alunoId: string, currentValue: boolean) => {
    setEditedPresencas(prev => ({
      ...prev,
      [chamadaId]: {
        ...(prev[chamadaId] || {}),
        [alunoId]: !currentValue,
      },
    }));
  };

  // Get effective presence value (edited or original)
  const getPresenca = (chamadaId: string, alunoId: string, original: boolean): boolean => {
    return editedPresencas[chamadaId]?.[alunoId] ?? original;
  };

  // Check if there are edits
  const hasEdits = Object.keys(editedPresencas).some(
    chamadaId => Object.keys(editedPresencas[chamadaId]).length > 0
  );

  // Save edited presencas
  const handleSave = async () => {
    setSaving(true);
    try {
      for (const chamadaId of Object.keys(editedPresencas)) {
        const chamada = chamadas.find(c => c.id === chamadaId);
        if (!chamada) continue;

        const edits = editedPresencas[chamadaId];
        if (!Object.keys(edits).length) continue;

        const updatedPresencas = chamada.presencas.map(p => ({
          ...p,
          presente: edits[p.alunoId] ?? p.presente,
        }));

        await chamadaService.update(chamadaId, { presencas: updatedPresencas });

        setChamadas(prev =>
          prev.map(c =>
            c.id === chamadaId ? { ...c, presencas: updatedPresencas } : c
          )
        );
      }

      setEditedPresencas({});
      addToast('Presencas atualizadas com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      addToast('Erro ao salvar presencas', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reload when key props change
  useEffect(() => {
    if (turmaId && disciplinaId && data) {
      loadChamadas();
    }
  }, [turmaId, disciplinaId, data, loadChamadas]);

  // Build SGE external URL with dynamic params
  const getSgeUrl = (chamada: Chamada) => {
    const base = 'https://e-aluno.com.br/christ/diario/relatorio_detalhamento_chamada.php';
    const turmaMapping = eAlunoConfig?.turmaMap?.[turmaId];
    const disciplinaMapping = eAlunoConfig?.disciplinaMap?.[disciplinaId];
    if (!turmaMapping || !disciplinaMapping) return base;

    const params = new URLSearchParams({
      serie: String(turmaMapping.serie),
      turma: String(turmaMapping.turma),
      turno: turmaMapping.turno,
      disciplina: String(disciplinaMapping),
      data,
      aula: String(chamada.tempo),
      txtSerie: turma?.nome || '',
      ano: String(new Date(data + 'T12:00:00').getFullYear()),
    });
    return `${base}?${params.toString()}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loaded && chamadas.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Nenhuma chamada registrada para {turma?.nome || 'esta turma'} - {disciplina?.nome || 'esta disciplina'} em {formatDateFull(data)}.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">
          {turma?.nome} - {disciplina?.nome} - {formatDateFull(data)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={checkingSge ? <CircularProgress size={16} /> : <SyncIcon />}
            onClick={handleVerificarSge}
            disabled={checkingSge || chamadas.length === 0}
            size="small"
          >
            Verificar SGE
          </Button>
          {hasEdits && (
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              size="small"
            >
              Salvar
            </Button>
          )}
        </Box>
      </Box>

      {chamadas.map((chamada) => (
        <Paper key={chamada.id} sx={{ mb: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 1.5, bgcolor: 'grey.100', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2">
              {chamada.tempo}o Tempo
              {chamada.conteudo && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  — {chamada.conteudo}
                </Typography>
              )}
            </Typography>
            <IconButton
              size="small"
              color="primary"
              onClick={() => window.open(getSgeUrl(chamada), '_blank')}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }} align="center">#</TableCell>
                  <TableCell>Aluno</TableCell>
                  <TableCell align="center" sx={{ width: 80 }}>Status</TableCell>
                  {Object.keys(sgeStatus).length > 0 && (
                    <TableCell align="center" sx={{ width: 120 }}>Status SGE</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {chamada.presencas.map((presenca, idx) => {
                  const key = `${chamada.id}:${presenca.alunoId}`;
                  const sge = sgeStatus[key];
                  const presente = getPresenca(chamada.id, presenca.alunoId, presenca.presente);
                  const isEdited = editedPresencas[chamada.id]?.[presenca.alunoId] !== undefined;

                  return (
                    <TableRow key={presenca.alunoId} sx={isEdited ? { bgcolor: 'warning.50' } : undefined}>
                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary">{idx + 1}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{presenca.alunoNome}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={presente}
                          onChange={() => handleTogglePresenca(chamada.id, presenca.alunoId, presente)}
                          size="small"
                          color={presente ? 'success' : 'error'}
                        />
                        <Typography variant="caption" color={presente ? 'success.main' : 'error.main'}>
                          {presente ? 'P' : 'F'}
                        </Typography>
                      </TableCell>
                      {Object.keys(sgeStatus).length > 0 && (
                        <TableCell align="center">
                          {sge ? (
                            <Chip
                              label={
                                sge.status === 'ok'
                                  ? 'OK'
                                  : sge.status === 'divergente'
                                    ? `Divergente (SGE: ${sge.sgePresenteLabel})`
                                    : 'Nao encontrado'
                              }
                              size="small"
                              color={
                                sge.status === 'ok'
                                  ? 'success'
                                  : sge.status === 'divergente'
                                    ? 'error'
                                    : 'default'
                              }
                              variant={sge.status === 'nao_encontrado' ? 'outlined' : 'filled'}
                            />
                          ) : (
                            <Chip label="—" size="small" variant="outlined" />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}
    </Box>
  );
}
