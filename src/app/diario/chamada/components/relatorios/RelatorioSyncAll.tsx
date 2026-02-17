/**
 * Sincronizar Tudo - Envia todas as chamadas nao sincronizadas ao SGE.
 * Agrupa chamadas por data+turma+disciplina (= 1 chamada no SGE),
 * resolve mapeamentos e envia sequencialmente.
 *
 * No SGE, cada data+disciplina e UMA chamada com aula = qtde de tempos.
 * A presenca e mesclada: aluno presente se presente em qualquer tempo.
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
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { deleteField } from 'firebase/firestore';
import { Chamada, Turma, Disciplina, Usuario, EAlunoConfig } from '@/types';
import { chamadaService } from '@/services/firestore';
import { eAlunoConfigService } from '@/services/firestore/eAlunoConfigService';
import { useUIStore } from '@/store/uiStore';
import { useFilterStore } from '@/store/filterStore';
import { formatDate } from './utils';

type SyncStatus = 'pending' | 'sending' | 'synced' | 'error';

/** A group of chamadas that map to ONE chamada in SGE (same date+turma+disciplina) */
interface ChamadaGroup {
  key: string; // date|turmaId|disciplinaId
  date: string; // ISO date
  turmaId: string;
  disciplinaId: string;
  turmaNome: string;
  disciplinaNome: string;
  tempos: number; // count of tempos (= aula in SGE)
  chamadas: Chamada[]; // individual tempo chamadas
  presentes: number; // unique students present in any tempo
  total: number; // unique students total
  status: SyncStatus;
  errorMsg?: string;
}

interface RelatorioSyncAllProps {
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

/** Merge presences across tempos: student is present if present in ANY tempo */
function mergePresences(chamadas: Chamada[]): { alunoId: string; alunoNome: string; presente: boolean }[] {
  const studentMap = new Map<string, { alunoNome: string; presente: boolean }>();
  for (const c of chamadas) {
    for (const p of c.presencas) {
      const existing = studentMap.get(p.alunoId);
      if (!existing) {
        studentMap.set(p.alunoId, { alunoNome: p.alunoNome, presente: p.presente });
      } else if (p.presente) {
        // If present in any tempo, mark as present
        existing.presente = true;
      }
    }
  }
  return Array.from(studentMap.entries()).map(([alunoId, { alunoNome, presente }]) => ({
    alunoId, alunoNome, presente,
  }));
}

export function RelatorioSyncAll({ turmas, disciplinas, professor }: RelatorioSyncAllProps) {
  const { addToast } = useUIStore();
  const { ano } = useFilterStore();

  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [statusOverrides, setStatusOverrides] = useState<Record<string, { status: SyncStatus; errorMsg?: string }>>({});
  const [summary, setSummary] = useState<{ sent: number; failed: number; skipped: number } | null>(null);

  // Load all unsent chamadas
  const loadChamadas = useCallback(async () => {
    if (!professor?.id) return;
    setLoading(true);
    try {
      const startOfYear = new Date(ano, 0, 1);
      const endOfYear = new Date(ano, 11, 31, 23, 59, 59);
      const all = await chamadaService.getByProfessorPeriodo(professor.id, startOfYear, endOfYear);
      const unsent = all.filter(c => !c.sgeSyncedAt);
      setChamadas(unsent);
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
        const merged = mergePresences(groupChamadas);
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
          presentes: merged.filter(m => m.presente).length,
          total: merged.length,
          status: override?.status || 'pending' as SyncStatus,
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

  // Mapping helpers
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

  // Student matching cache
  const eAlunoStudentsCache = useMemo(() => new Map<string, Array<{ id: number; nome: string }>>(), []);

  const autoMatchStudents = useCallback(async (
    config: EAlunoConfig,
    mapping: { serie: number; turma: number; turno: string },
    presencas: Array<{ alunoId: string; alunoNome: string }>,
  ): Promise<Record<string, number>> => {
    const cacheKey = `${mapping.serie}-${mapping.turma}-${mapping.turno}`;
    let eAlunoStudents = eAlunoStudentsCache.get(cacheKey);

    if (!eAlunoStudents) {
      const res = await fetch('/api/sge/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: config.credentials.user, password: config.credentials.password,
          serie: mapping.serie, turma: mapping.turma, turno: mapping.turno, ano, fetch: 'alunos',
        }),
      });
      const result = await res.json();
      eAlunoStudents = result.success ? (result.data?.alunos || []) : [];
      eAlunoStudentsCache.set(cacheKey, eAlunoStudents!);
    }

    const currentMap = { ...(config.alunoMap || {}) };
    let newMappings = 0;

    for (const p of presencas) {
      if (currentMap[p.alunoId]) continue;
      const normalizedName = normalizeName(p.alunoNome);
      let matched = eAlunoStudents!.find(ea => normalizeName(ea.nome) === normalizedName);
      if (!matched) {
        const parts = normalizedName.split(' ');
        if (parts.length >= 2) {
          const firstName = parts[0];
          const lastName = parts[parts.length - 1];
          matched = eAlunoStudents!.find(ea => {
            const eaParts = normalizeName(ea.nome).split(' ');
            return eaParts[0] === firstName && eaParts[eaParts.length - 1] === lastName;
          });
        }
      }
      if (matched) {
        currentMap[p.alunoId] = matched.id;
        newMappings++;
      }
    }

    if (newMappings > 0) {
      await eAlunoConfigService.saveAlunoMap(professor!.id, currentMap);
    }
    return currentMap;
  }, [professor, ano, eAlunoStudentsCache]);

  // Send all pending groups (1 SGE request per group)
  const handleSyncAll = async () => {
    if (!professor?.id) return;

    const config = await eAlunoConfigService.getByUser(professor.id);
    if (!config?.credentials?.user || !config?.credentials?.password) {
      addToast('Credenciais SGE nao configuradas. Acesse o botao de config na aba Chamada.', 'error');
      return;
    }

    const pending = groups.filter(g => g.status === 'pending');
    if (pending.length === 0) {
      addToast('Nenhuma chamada pendente para enviar', 'info');
      return;
    }

    setSending(true);
    setProgress({ current: 0, total: pending.length });
    setSummary(null);

    let sent = 0, failed = 0, skipped = 0;

    for (let i = 0; i < pending.length; i++) {
      const group = pending[i];
      setProgress({ current: i + 1, total: pending.length });
      setStatusOverrides(prev => ({ ...prev, [group.key]: { status: 'sending' } }));

      try {
        const latestConfig = await eAlunoConfigService.getByUser(professor.id);
        if (!latestConfig) { skipped++; continue; }

        // Use first chamada for mapping resolution (all in group share turmaId/disciplinaId)
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

        // Merge presences across all tempos in the group
        const merged = mergePresences(group.chamadas);
        const alunoMap = await autoMatchStudents(latestConfig, mapping, merged);

        const presencasMap: Record<string, boolean> = {};
        for (const p of merged) {
          if (alunoMap[p.alunoId]) {
            presencasMap[p.alunoId] = p.presente;
          }
        }

        if (Object.keys(presencasMap).length === 0) {
          setStatusOverrides(prev => ({
            ...prev,
            [group.key]: { status: 'error', errorMsg: 'Nenhum aluno mapeado' },
          }));
          failed++;
          continue;
        }

        // Send ONE request with aula = number of tempos
        const res = await fetch('/api/sge/chamada', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: config.credentials.user,
            password: config.credentials.password,
            serie: mapping.serie,
            turma: mapping.turma,
            turno: mapping.turno,
            disciplina: mapping.disciplina,
            ano,
            data: group.date,
            aula: group.tempos,
            alunoMap,
            presencas: presencasMap,
          }),
        });

        const result = await res.json();

        if (result.success) {
          // Mark ALL chamadas in the group as synced
          for (const c of group.chamadas) {
            await chamadaService.update(c.id, { sgeSyncedAt: new Date(), sgeSyncError: deleteField() } as any);
          }
          setStatusOverrides(prev => ({ ...prev, [group.key]: { status: 'synced' } }));
          sent++;
        } else {
          const msg = result.error || result.message || 'Erro SGE';
          for (const c of group.chamadas) {
            await chamadaService.update(c.id, { sgeSyncError: msg });
          }
          setStatusOverrides(prev => ({
            ...prev,
            [group.key]: { status: 'error', errorMsg: msg },
          }));
          failed++;
        }
      } catch (error) {
        console.error('[SyncAll] Erro:', error);
        setStatusOverrides(prev => ({
          ...prev,
          [group.key]: { status: 'error', errorMsg: 'Erro de conexao' },
        }));
        failed++;
      }
    }

    setSending(false);
    setSummary({ sent, failed, skipped });
    addToast(
      `Sincronizacao concluida: ${sent} enviada(s)${failed > 0 ? `, ${failed} falha(s)` : ''}`,
      failed > 0 ? 'warning' : 'success',
    );
  };

  const getStatusChip = (group: ChamadaGroup) => {
    switch (group.status) {
      case 'synced':
        return <Chip label="Enviado" color="success" size="small" icon={<CheckIcon />} />;
      case 'sending':
        return <Chip label="Enviando..." color="warning" size="small" />;
      case 'error':
        return <Chip label={group.errorMsg || 'Erro'} color="error" size="small" />;
      default:
        return <Chip label="Pendente" variant="outlined" size="small" />;
    }
  };

  const pendingCount = groups.filter(g => g.status === 'pending').length;
  const sentCount = groups.filter(g => g.status === 'synced').length;
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 6, gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Carregando chamadas nao sincronizadas...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} color="warning.main">{pendingCount}</Typography>
          <Typography variant="body2" color="text.secondary">Pendentes</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} color="success.main">{sentCount}</Typography>
          <Typography variant="body2" color="text.secondary">Enviadas agora</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700}>{groups.length}</Typography>
          <Typography variant="body2" color="text.secondary">Total</Typography>
        </Paper>
      </Stack>

      {/* Group breakdown */}
      {turmaDisciplinaSummary.length > 0 && !sending && (
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

      {/* Actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
            onClick={handleSyncAll}
            disabled={sending || pendingCount === 0}
            sx={{ fontWeight: 600 }}
          >
            {sending
              ? `Enviando ${progress.current}/${progress.total}...`
              : `Sincronizar Tudo (${pendingCount})`
            }
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadChamadas}
            disabled={sending}
            size="small"
          >
            Recarregar
          </Button>
        </Stack>

        {sending && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progressPercent} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {progress.current} de {progress.total} chamadas processadas
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Result summary */}
      {summary && (
        <Alert
          severity={summary.failed > 0 ? 'warning' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => setSummary(null)}
        >
          Resultado: {summary.sent} enviada(s)
          {summary.failed > 0 && `, ${summary.failed} falha(s)`}
          {summary.skipped > 0 && `, ${summary.skipped} pulada(s)`}
        </Alert>
      )}

      {/* Empty state */}
      {groups.length === 0 && !loading && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Todas as chamadas de {ano} ja estao sincronizadas com o SGE!
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
                <TableCell align="center">Presentes</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <TableRow
                  key={group.key}
                  sx={{ opacity: group.status === 'sending' ? 0.6 : 1 }}
                >
                  <TableCell>{formatDate(group.date)}</TableCell>
                  <TableCell>{group.turmaNome}</TableCell>
                  <TableCell>{group.disciplinaNome}</TableCell>
                  <TableCell align="center">{group.tempos}</TableCell>
                  <TableCell align="center">{group.presentes}/{group.total}</TableCell>
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
