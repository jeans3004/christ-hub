/**
 * Excluir Tudo do SGE - Remove todas as chamadas sincronizadas do SGE.
 * Agrupa chamadas por data+turma+disciplina (= 1 chamada no SGE),
 * resolve mapeamentos e exclui sequencialmente via /api/sge/chamada-delete.
 *
 * O delete do SGE opera por data+disciplina, entao agrupamos igual ao SyncAll.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Alert,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  DeleteForever as DeleteIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { deleteField } from 'firebase/firestore';
import { Chamada, Turma, Disciplina, Usuario, EAlunoConfig } from '@/types';
import { chamadaService } from '@/services/firestore';
import { eAlunoConfigService } from '@/services/firestore/eAlunoConfigService';
import { useUIStore } from '@/store/uiStore';
import { useFilterStore } from '@/store/filterStore';
import { formatDate } from './utils';

type DeleteStatus = 'pending' | 'deleting' | 'deleted' | 'error';

/** A group of chamadas that map to ONE chamada in SGE (same date+turma+disciplina) */
interface ChamadaGroup {
  key: string;
  date: string;
  turmaId: string;
  disciplinaId: string;
  turmaNome: string;
  disciplinaNome: string;
  tempos: number;
  chamadas: Chamada[];
  status: DeleteStatus;
  errorMsg?: string;
}

interface RelatorioDeleteAllProps {
  turmas: Turma[];
  disciplinas: Disciplina[];
  professor: Usuario | null;
}

const disciplinaAliases: Record<string, string> = {
  'robotica e educacao digital': 'pensamento computacional',
  'educacao digital': 'pensamento computacional',
  'robotica': 'pensamento computacional',
};

const normalizeName = (name: string) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function toISODate(data: Date | unknown): string {
  const d = data instanceof Date ? data : new Date(data as string | number);
  return d.toISOString().split('T')[0];
}

export function RelatorioDeleteAll({ turmas, disciplinas, professor }: RelatorioDeleteAllProps) {
  const { addToast } = useUIStore();
  const { ano } = useFilterStore();

  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [statusOverrides, setStatusOverrides] = useState<Record<string, { status: DeleteStatus; errorMsg?: string }>>({});
  const [summary, setSummary] = useState<{ deleted: number; failed: number; skipped: number } | null>(null);

  // Load all synced chamadas
  const loadChamadas = useCallback(async () => {
    if (!professor?.id) return;
    setLoading(true);
    try {
      const startOfYear = new Date(ano, 0, 1);
      const endOfYear = new Date(ano, 11, 31, 23, 59, 59);
      const all = await chamadaService.getByProfessorPeriodo(professor.id, startOfYear, endOfYear);
      const synced = all.filter(c => c.sgeSyncedAt);
      setChamadas(synced);
      setStatusOverrides({});
      setSummary(null);
    } catch (error) {
      console.error('Erro ao carregar chamadas:', error);
      addToast('Erro ao carregar chamadas', 'error');
    } finally {
      setLoading(false);
    }
  }, [professor?.id, ano, addToast]);

  useEffect(() => {
    loadChamadas();
  }, [loadChamadas]);

  // Group chamadas by date+turma+disciplina (= 1 SGE chamada)
  const groups: ChamadaGroup[] = useMemo(() => {
    const map = new Map<string, { chamadas: Chamada[]; turmaId: string; disciplinaId: string; date: string }>();

    for (const c of chamadas) {
      const date = toISODate(c.data);
      const key = `${date}|${c.turmaId}|${c.disciplinaId}`;
      const existing = map.get(key);
      if (existing) {
        existing.chamadas.push(c);
      } else {
        map.set(key, { chamadas: [c], turmaId: c.turmaId, disciplinaId: c.disciplinaId, date });
      }
    }

    return Array.from(map.entries())
      .map(([key, { chamadas: groupChamadas, turmaId, disciplinaId, date }]) => {
        const turma = turmas.find(t => t.id === turmaId);
        const disc = disciplinas.find(d => d.id === disciplinaId);
        const override = statusOverrides[key];

        return {
          key,
          date,
          turmaId,
          disciplinaId,
          turmaNome: turma?.nome || turmaId,
          disciplinaNome: disc?.nome || disciplinaId,
          tempos: groupChamadas.length,
          chamadas: groupChamadas.sort((a, b) => a.tempo - b.tempo),
          status: override?.status || 'pending' as DeleteStatus,
          errorMsg: override?.errorMsg,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.turmaNome.localeCompare(b.turmaNome));
  }, [chamadas, turmas, disciplinas, statusOverrides]);

  // Group breakdown by turma+disciplina
  const turmaDisciplinaSummary = useMemo(() => {
    const map = new Map<string, { turma: string; disciplina: string; count: number }>();
    for (const g of groups) {
      const tdKey = `${g.turmaId}|${g.disciplinaId}`;
      const existing = map.get(tdKey);
      if (existing) {
        existing.count++;
      } else {
        map.set(tdKey, { turma: g.turmaNome, disciplina: g.disciplinaNome, count: 1 });
      }
    }
    return Array.from(map.values());
  }, [groups]);

  // Mapping helper
  const resolveMapping = useCallback((
    config: EAlunoConfig,
    chamada: Chamada,
  ): { serie: number; turma: number; turno: string; disciplina: number } | null => {
    const tm = config.turmaMap?.[chamada.turmaId];
    const dm = config.disciplinaMap?.[chamada.disciplinaId];
    if (!tm || !dm) return null;
    return { serie: tm.serie, turma: tm.turma, turno: tm.turno, disciplina: dm };
  }, []);

  const autoDiscoverMappings = useCallback(async (
    config: EAlunoConfig,
    chamada: Chamada,
  ): Promise<{ serie: number; turma: number; turno: string; disciplina: number } | null> => {
    const turma = turmas.find(t => t.id === chamada.turmaId);
    const disc = disciplinas.find(d => d.id === chamada.disciplinaId);
    if (!turma || !disc) return null;

    let tm = config.turmaMap?.[chamada.turmaId];
    let dm = config.disciplinaMap?.[chamada.disciplinaId];

    if (!tm) {
      const loginRes = await fetch('/api/sge/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: config.credentials.user, password: config.credentials.password }),
      });
      const loginData = await loginRes.json();
      if (!loginData.success) return null;

      const options: Array<{ serie: number; turma: number; turno: string; label: string }> = loginData.data?.options || [];
      const matched = options.find(opt => {
        if (normalizeName(opt.turno) !== normalizeName(turma.turno)) return false;
        if (turma.serie && !normalizeName(opt.label).includes(normalizeName(turma.serie))) return false;
        if (turma.turma) {
          const bracketMatch = opt.label.match(/\[\s*\S+\s+(\S+)\s*\]/);
          if (!bracketMatch || bracketMatch[1].toUpperCase() !== turma.turma.toUpperCase()) return false;
        }
        return true;
      });

      if (!matched) return null;
      await eAlunoConfigService.saveTurmaMap(professor!.id, chamada.turmaId, {
        serie: matched.serie, turma: matched.turma, turno: matched.turno,
      });
      tm = { serie: matched.serie, turma: matched.turma, turno: matched.turno };
    }

    if (!dm && tm) {
      const dataRes = await fetch('/api/sge/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: config.credentials.user, password: config.credentials.password,
          serie: tm.serie, turma: tm.turma, turno: tm.turno, ano, fetch: 'disciplinas',
        }),
      });
      const dataResult = await dataRes.json();
      if (dataResult.success && dataResult.data?.disciplinas) {
        const normalizedDisc = normalizeName(disc.nome);
        const aliasName = disciplinaAliases[normalizedDisc];
        const matched = dataResult.data.disciplinas.find(
          (d: { id: number; nome: string }) => {
            const n = normalizeName(d.nome);
            return n === normalizedDisc || n.includes(normalizedDisc) || normalizedDisc.includes(n) ||
              (aliasName && n.includes(aliasName));
          }
        );
        if (!matched) return null;
        await eAlunoConfigService.saveDisciplinaMap(professor!.id, chamada.disciplinaId, matched.id);
        dm = matched.id;
      }
    }

    if (!tm || !dm) return null;
    return { serie: tm.serie, turma: tm.turma, turno: tm.turno, disciplina: typeof dm === 'number' ? dm : 0 };
  }, [turmas, disciplinas, professor, ano]);

  // Delete all synced groups from SGE (1 delete per group)
  const handleDeleteAll = async () => {
    setConfirmOpen(false);
    if (!professor?.id) return;

    const config = await eAlunoConfigService.getByUser(professor.id);
    if (!config?.credentials?.user || !config?.credentials?.password) {
      addToast('Credenciais SGE nao configuradas. Acesse o botao de config na aba Chamada.', 'error');
      return;
    }

    const pending = groups.filter(g => g.status === 'pending');
    if (pending.length === 0) {
      addToast('Nenhuma chamada para excluir', 'info');
      return;
    }

    setDeleting(true);
    setProgress({ current: 0, total: pending.length });
    setSummary(null);

    let deleted = 0, failed = 0, skipped = 0;

    for (let i = 0; i < pending.length; i++) {
      const group = pending[i];
      setProgress({ current: i + 1, total: pending.length });
      setStatusOverrides(prev => ({ ...prev, [group.key]: { status: 'deleting' } }));

      try {
        const latestConfig = await eAlunoConfigService.getByUser(professor.id);
        if (!latestConfig) { skipped++; continue; }

        const refChamada = group.chamadas[0];
        let mapping = resolveMapping(latestConfig, refChamada);
        if (!mapping) {
          mapping = await autoDiscoverMappings(latestConfig, refChamada);
        }

        if (!mapping) {
          setStatusOverrides(prev => ({
            ...prev,
            [group.key]: { status: 'error', errorMsg: 'Mapeamento nao encontrado' },
          }));
          failed++;
          continue;
        }

        const res = await fetch('/api/sge/chamada-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: config.credentials.user,
            password: config.credentials.password,
            serie: mapping.serie,
            turma: mapping.turma,
            turno: mapping.turno,
            disciplina: mapping.disciplina,
            data: group.date,
          }),
        });

        const result = await res.json();

        if (result.success) {
          // Clear sgeSyncedAt on ALL chamadas in the group
          for (const c of group.chamadas) {
            await chamadaService.update(c.id, { sgeSyncedAt: deleteField(), sgeSyncError: deleteField() } as any);
          }
          setStatusOverrides(prev => ({ ...prev, [group.key]: { status: 'deleted' } }));
          deleted++;
        } else {
          const msg = result.error || 'Erro SGE';
          setStatusOverrides(prev => ({
            ...prev,
            [group.key]: { status: 'error', errorMsg: msg },
          }));
          failed++;
        }
      } catch (error) {
        console.error('[DeleteAll] Erro:', error);
        setStatusOverrides(prev => ({
          ...prev,
          [group.key]: { status: 'error', errorMsg: 'Erro de conexao' },
        }));
        failed++;
      }
    }

    setDeleting(false);
    setSummary({ deleted, failed, skipped });
    addToast(
      `Exclusao concluida: ${deleted} excluida(s)${failed > 0 ? `, ${failed} falha(s)` : ''}`,
      failed > 0 ? 'warning' : 'success',
    );
  };

  const getStatusChip = (group: ChamadaGroup) => {
    switch (group.status) {
      case 'deleted':
        return <Chip label="Excluida" color="success" size="small" icon={<CheckIcon />} />;
      case 'deleting':
        return <Chip label="Excluindo..." color="warning" size="small" />;
      case 'error':
        return <Chip label={group.errorMsg || 'Erro'} color="error" size="small" />;
      default:
        return <Chip label="Sincronizada" color="info" size="small" />;
    }
  };

  const pendingCount = groups.filter(g => g.status === 'pending').length;
  const deletedCount = groups.filter(g => g.status === 'deleted').length;
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 6, gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Carregando chamadas sincronizadas...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} color="error.main">{pendingCount}</Typography>
          <Typography variant="body2" color="text.secondary">Para excluir</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} color="success.main">{deletedCount}</Typography>
          <Typography variant="body2" color="text.secondary">Excluidas agora</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700}>{groups.length}</Typography>
          <Typography variant="body2" color="text.secondary">Total sincronizadas</Typography>
        </Paper>
      </Stack>

      {/* Group breakdown */}
      {turmaDisciplinaSummary.length > 0 && !deleting && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Resumo por turma/disciplina
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {turmaDisciplinaSummary.map((g, i) => (
              <Chip
                key={i}
                label={`${g.turma} - ${g.disciplina} (${g.count} dia${g.count > 1 ? 's' : ''})`}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Warning */}
      {groups.length > 0 && !deleting && !summary && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
          Esta acao vai excluir <strong>todas</strong> as chamadas listadas abaixo do SGE (e-aluno).
          Os dados no Luminar serao mantidos e poderao ser re-enviados depois.
        </Alert>
      )}

      {/* Actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            onClick={() => setConfirmOpen(true)}
            disabled={deleting || pendingCount === 0}
            sx={{ fontWeight: 600 }}
          >
            {deleting
              ? `Excluindo ${progress.current}/${progress.total}...`
              : `Excluir Tudo do SGE (${pendingCount})`
            }
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadChamadas}
            disabled={deleting}
            size="small"
          >
            Recarregar
          </Button>
        </Stack>

        {deleting && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progressPercent} color="error" />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {progress.current} de {progress.total} chamadas processadas
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Confirmar exclusao
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir <strong>{pendingCount} chamada(s)</strong> do SGE?
            <br /><br />
            Os dados no Luminar serao mantidos intactos. Voce podera re-enviar
            as chamadas usando &quot;Sincronizar Tudo&quot; depois.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteAll} color="error" variant="contained" autoFocus>
            Sim, excluir tudo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Result summary */}
      {summary && (
        <Alert
          severity={summary.failed > 0 ? 'warning' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => setSummary(null)}
        >
          Resultado: {summary.deleted} excluida(s)
          {summary.failed > 0 && `, ${summary.failed} falha(s)`}
          {summary.skipped > 0 && `, ${summary.skipped} pulada(s)`}
        </Alert>
      )}

      {/* Empty state */}
      {groups.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Nenhuma chamada sincronizada com o SGE em {ano}. Nada para excluir.
        </Alert>
      )}

      {/* Table - one row per date+turma+disciplina group */}
      {groups.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Turma</TableCell>
                <TableCell>Disciplina</TableCell>
                <TableCell align="center">Aulas</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <TableRow
                  key={group.key}
                  sx={{ opacity: group.status === 'deleting' ? 0.6 : 1 }}
                >
                  <TableCell>{formatDate(group.date)}</TableCell>
                  <TableCell>{group.turmaNome}</TableCell>
                  <TableCell>{group.disciplinaNome}</TableCell>
                  <TableCell align="center">{group.tempos}</TableCell>
                  <TableCell>{getStatusChip(group)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
