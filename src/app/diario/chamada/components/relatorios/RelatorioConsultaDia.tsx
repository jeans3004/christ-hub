/**
 * Relatorio Consultar Dia - Espelha "Detalhamento da chamada" do SGE.
 * Tabela consolidada: uma linha por aluno, colunas por tempo, status combinado "P,F".
 * Verifica SGE buscando todos os tempos (inclusive extras nao registrados no Luminar).
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
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
  Tooltip,
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

/** Combined SGE status per student */
interface SgeCombinedStatus {
  label: string; // "P,F" or "N/M" (nao mapeado)
  perAula: Array<{ aula: number; presente: boolean }>;
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
  const [sgeStatus, setSgeStatus] = useState<Record<string, SgeCombinedStatus>>({});
  const [sgeChecked, setSgeChecked] = useState(false);
  const [checkingSge, setCheckingSge] = useState(false);
  const [editedPresencas, setEditedPresencas] = useState<Record<string, Record<string, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [eAlunoConfig, setEAlunoConfig] = useState<EAlunoConfig | null>(null);

  const turma = turmas.find(t => t.id === turmaId);
  const disciplina = disciplinas.find(d => d.id === disciplinaId);

  // Consolidated student list (unique, sorted by name)
  const allStudents = useMemo(() => {
    const map = new Map<string, { id: string; nome: string }>();
    for (const c of chamadas) {
      for (const p of c.presencas) {
        if (!map.has(p.alunoId)) map.set(p.alunoId, { id: p.alunoId, nome: p.alunoNome });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [chamadas]);

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
      setSgeChecked(false);
      setEditedPresencas({});
    } catch (error) {
      console.error('Erro ao carregar chamadas:', error);
      addToast('Erro ao carregar chamadas', 'error');
    } finally {
      setLoading(false);
    }
  }, [turmaId, disciplinaId, data, addToast]);

  // Check SGE status - fetches all aulas (Luminar tempos + extras) and builds combined status
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

      // Check Luminar tempos + 2 extra aulas to detect SGE-only entries
      const luminarTempos = chamadas.map(c => c.tempo);
      const maxTempo = Math.max(...luminarTempos, 0);
      const aulasToCheck: number[] = [];
      for (let a = 1; a <= Math.min(maxTempo + 2, 7); a++) {
        aulasToCheck.push(a);
      }

      // Fetch SGE data for each aula sequentially
      const sgeByAula: Record<number, Array<{ id: number; nome: string; presente: boolean }>> = {};

      for (const aula of aulasToCheck) {
        try {
          const res = await fetch('/api/sge/chamada-detail', {
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
              aula,
            }),
          });

          if (!res.ok) continue;
          const json = await res.json();
          if (json.success && json.data?.students?.length > 0) {
            sgeByAula[aula] = json.data.students;
          }
        } catch {
          // Skip failed aulas
        }
      }

      // Build combined status per student
      const sgeAulas = Object.keys(sgeByAula).map(Number).sort((a, b) => a - b);
      const newStatus: Record<string, SgeCombinedStatus> = {};

      // Collect all Luminar student IDs
      const studentIds = new Set<string>();
      for (const c of chamadas) {
        for (const p of c.presencas) studentIds.add(p.alunoId);
      }

      for (const alunoId of studentIds) {
        const eAlunoId = config.alunoMap?.[alunoId];
        if (!eAlunoId) {
          newStatus[alunoId] = { label: 'N/M', perAula: [] };
          continue;
        }

        const perAula: Array<{ aula: number; presente: boolean }> = [];
        for (const aula of sgeAulas) {
          const sgeStudent = sgeByAula[aula]?.find(s => s.id === eAlunoId);
          if (sgeStudent) {
            perAula.push({ aula, presente: sgeStudent.presente });
          }
        }

        newStatus[alunoId] = {
          label: perAula.length > 0 ? perAula.map(a => a.presente ? 'P' : 'F').join(',') : '-',
          perAula,
        };
      }

      setSgeStatus(newStatus);
      setSgeChecked(true);
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

  // Auto-verify SGE when chamadas load and config is available
  useEffect(() => {
    if (chamadas.length > 0 && eAlunoConfig?.credentials?.user && !sgeChecked && !checkingSge) {
      handleVerificarSge();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamadas.length, eAlunoConfig?.credentials?.user]);

  // Build SGE external URL
  const getSgeUrl = () => {
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
      txtSerie: turma?.nome || '',
      ano: String(new Date(data + 'T12:00:00').getFullYear()),
    });
    return `${base}?${params.toString()}`;
  };

  // Get combined Luminar status label for a student ("P,F")
  const getLuminarLabel = (alunoId: string): string => {
    return chamadas.map(c => {
      const p = c.presencas.find(p => p.alunoId === alunoId);
      if (!p) return '-';
      return getPresenca(c.id, alunoId, p.presente) ? 'P' : 'F';
    }).join(',');
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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">
            {turma?.nome} - {disciplina?.nome} - {formatDateFull(data)}
          </Typography>
          <Tooltip title="Abrir no SGE">
            <IconButton
              size="small"
              color="primary"
              onClick={() => window.open(getSgeUrl(), '_blank')}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
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

      {/* Conteudos summary */}
      {chamadas.some(c => c.conteudo) && (
        <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'grey.50' }}>
          {chamadas.filter(c => c.conteudo).map(c => (
            <Typography key={c.id} variant="body2" color="text.secondary">
              <strong>{c.tempo}o Tempo:</strong> {c.conteudo}
            </Typography>
          ))}
        </Paper>
      )}

      {/* Consolidated Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40 }} align="center">#</TableCell>
                <TableCell>Aluno</TableCell>
                {chamadas.map(c => (
                  <TableCell key={c.id} align="center" sx={{ width: 60, px: 0.5 }}>
                    {c.tempo}o
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ width: 80 }}>Luminar</TableCell>
                <TableCell align="center" sx={{ width: 120 }}>SGE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allStudents.map((student, idx) => {
                const luminarLabel = getLuminarLabel(student.id);
                const sge = sgeStatus[student.id];
                const hasSge = sge && sge.label !== 'N/M' && sge.label !== '-';
                const isDivergent = hasSge && luminarLabel !== sge.label;
                const hasAnyEdit = chamadas.some(c => editedPresencas[c.id]?.[student.id] !== undefined);

                return (
                  <TableRow key={student.id} sx={hasAnyEdit ? { bgcolor: 'warning.50' } : undefined}>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">{idx + 1}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{student.nome}</Typography>
                    </TableCell>
                    {chamadas.map(c => {
                      const p = c.presencas.find(p => p.alunoId === student.id);
                      if (!p) return <TableCell key={c.id} align="center" sx={{ px: 0.5 }}>—</TableCell>;
                      const presente = getPresenca(c.id, student.id, p.presente);
                      return (
                        <TableCell key={c.id} align="center" sx={{ px: 0.5 }}>
                          <Checkbox
                            checked={presente}
                            onChange={() => handleTogglePresenca(c.id, student.id, presente)}
                            size="small"
                            color={presente ? 'success' : 'error'}
                            sx={{ p: 0.5 }}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        color={luminarLabel.includes('F') ? 'error.main' : 'success.main'}
                      >
                        {luminarLabel}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {checkingSge ? (
                        <CircularProgress size={16} />
                      ) : sge ? (
                        <Chip
                          label={sge.label}
                          size="small"
                          color={
                            sge.label === 'N/M' ? 'default' :
                            isDivergent ? 'error' : 'success'
                          }
                          variant={sge.label === 'N/M' ? 'outlined' : 'filled'}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Divergence summary */}
      {sgeChecked && (() => {
        const divergentes = allStudents.filter(s => {
          const sge = sgeStatus[s.id];
          if (!sge || sge.label === 'N/M' || sge.label === '-') return false;
          return getLuminarLabel(s.id) !== sge.label;
        });
        const naoMapeados = allStudents.filter(s => sgeStatus[s.id]?.label === 'N/M');
        const sgeExtra = allStudents.some(s => {
          const sge = sgeStatus[s.id];
          return sge && sge.perAula.length > chamadas.length;
        });

        return (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {divergentes.length > 0 && (
              <Alert severity="warning" sx={{ flex: 1 }}>
                {divergentes.length} aluno(s) com divergencia entre Luminar e SGE.
              </Alert>
            )}
            {naoMapeados.length > 0 && (
              <Alert severity="info" sx={{ flex: 1 }}>
                {naoMapeados.length} aluno(s) sem mapeamento no SGE (N/M).
              </Alert>
            )}
            {sgeExtra && (
              <Alert severity="info" sx={{ flex: 1 }}>
                SGE possui mais aulas registradas que o Luminar neste dia.
              </Alert>
            )}
            {divergentes.length === 0 && naoMapeados.length === 0 && !sgeExtra && (
              <Alert severity="success" sx={{ flex: 1 }}>
                Luminar e SGE estao sincronizados.
              </Alert>
            )}
          </Box>
        );
      })()}
    </Box>
  );
}
