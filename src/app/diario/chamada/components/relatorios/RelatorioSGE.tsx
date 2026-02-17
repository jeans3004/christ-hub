/**
 * Relatorio SGE - Envio em lote de chamadas para o e-aluno (SGE).
 * Permite verificar duplicatas e enviar chamadas selecionadas.
 */

import { useState, useMemo, useCallback } from 'react';
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
  Checkbox,
  LinearProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario, EAlunoConfig } from '@/types';
import { chamadaService } from '@/services/firestore';
import { eAlunoConfigService } from '@/services/firestore/eAlunoConfigService';
import { useUIStore } from '@/store/uiStore';
import { useFilterStore } from '@/store/filterStore';
import { formatDate } from './utils';

type SGEStatus = 'synced' | 'pending' | 'remote_exists' | 'sending' | 'error';

interface ChamadaRow {
  chamada: Chamada;
  turmaNome: string;
  disciplinaNome: string;
  presentes: number;
  total: number;
  status: SGEStatus;
  errorMsg?: string;
}

interface RelatorioSGEProps {
  chamadas: Chamada[];
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

/** Extract YYYY-MM-DD from a Firestore Date */
function toISODate(data: Date | unknown): string {
  const d = data instanceof Date ? data : new Date(data as string | number);
  return d.toISOString().split('T')[0];
}

export function RelatorioSGE({ chamadas, turmas, disciplinas, professor }: RelatorioSGEProps) {
  const { addToast } = useUIStore();
  const { ano } = useFilterStore();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [statusOverrides, setStatusOverrides] = useState<Record<string, { status: SGEStatus; errorMsg?: string }>>({});
  const [summary, setSummary] = useState<{ sent: number; existed: number; failed: number } | null>(null);

  // Build rows with status info
  const rows: ChamadaRow[] = useMemo(() => {
    return chamadas
      .sort((a, b) => {
        const dateA = a.data instanceof Date ? a.data : new Date(a.data);
        const dateB = b.data instanceof Date ? b.data : new Date(b.data);
        return dateA.getTime() - dateB.getTime() || a.tempo - b.tempo;
      })
      .map((c) => {
        const turma = turmas.find(t => t.id === c.turmaId);
        const disc = disciplinas.find(d => d.id === c.disciplinaId);
        const presentes = c.presencas.filter(p => p.presente).length;
        const override = statusOverrides[c.id];

        let status: SGEStatus = 'pending';
        if (override) {
          status = override.status;
        } else if (c.sgeSyncedAt) {
          status = 'synced';
        }

        return {
          chamada: c,
          turmaNome: turma?.nome || c.turmaId,
          disciplinaNome: disc?.nome || c.disciplinaId,
          presentes,
          total: c.presencas.length,
          status,
          errorMsg: override?.errorMsg,
        };
      });
  }, [chamadas, turmas, disciplinas, statusOverrides]);

  // Rows that can be sent (not confirmed in SGE)
  const sendableRows = rows.filter(r => r.status !== 'remote_exists' && r.status !== 'sending');
  const unverifiedRows = rows.filter(r => r.status === 'pending' || r.status === 'synced');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(sendableRows.map(r => r.chamada.id)));
    } else {
      setSelected(new Set());
    }
  };

  const handleToggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadConfig = useCallback(async (): Promise<EAlunoConfig | null> => {
    if (!professor?.id) return null;
    const config = await eAlunoConfigService.getByUser(professor.id);
    if (!config?.credentials?.user || !config?.credentials?.password) {
      addToast('Credenciais SGE nao configuradas. Acesse o botao de config na aba Chamada.', 'error');
      return null;
    }
    return config;
  }, [professor?.id, addToast]);

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

  // Verificar no SGE - checks ALL rows (including "synced" that may be stale)
  const handleVerificar = async () => {
    const config = await loadConfig();
    if (!config) return;

    // Check all unverified rows (pending + synced from before fix)
    const toCheck = rows.filter(r => r.status === 'pending' || r.status === 'synced' || r.status === 'error');
    if (toCheck.length === 0) {
      addToast('Todas as chamadas ja foram verificadas no SGE', 'info');
      return;
    }

    setChecking(true);
    setProgress({ current: 0, total: toCheck.length });

    try {
      const chamadaParams = [];
      const chamadaIds: string[] = [];

      for (const row of toCheck) {
        let mapping = resolveMapping(config, row.chamada);
        if (!mapping) {
          const updatedConfig = await eAlunoConfigService.getByUser(professor!.id);
          if (updatedConfig) {
            mapping = resolveMapping(updatedConfig, row.chamada);
            if (!mapping) mapping = await autoDiscoverMappings(updatedConfig, row.chamada);
          }
        }

        if (mapping) {
          chamadaParams.push({
            serie: mapping.serie,
            turma: mapping.turma,
            turno: mapping.turno,
            disciplina: mapping.disciplina,
            ano,
            data: toISODate(row.chamada.data),
            aula: row.chamada.tempo,
          });
          chamadaIds.push(row.chamada.id);
        }
      }

      if (chamadaParams.length === 0) {
        addToast('Nenhuma chamada pode ser mapeada. Configure os mapeamentos SGE.', 'warning');
        setChecking(false);
        return;
      }

      const res = await fetch('/api/sge/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: config.credentials.user,
          password: config.credentials.password,
          chamadas: chamadaParams,
        }),
      });

      const result = await res.json();
      if (!result.success) {
        addToast(`Erro ao verificar: ${result.error}`, 'error');
        setChecking(false);
        return;
      }

      const newOverrides: Record<string, { status: SGEStatus }> = {};
      let foundCount = 0;
      let notFoundCount = 0;

      for (let i = 0; i < result.results.length; i++) {
        const r = result.results[i];
        const chamadaId = chamadaIds[i];
        const originalRow = toCheck.find(row => row.chamada.id === chamadaId);

        if (r.exists) {
          newOverrides[chamadaId] = { status: 'remote_exists' };
          // Confirm sync in Firestore
          await chamadaService.update(chamadaId, { sgeSyncedAt: new Date() });
          foundCount++;
        } else {
          // NOT found in SGE - if it was marked as synced, clear the stale marker
          if (originalRow?.chamada.sgeSyncedAt) {
            await chamadaService.update(chamadaId, { sgeSyncedAt: null as unknown as Date });
          }
          newOverrides[chamadaId] = { status: 'pending' };
          notFoundCount++;
        }
      }

      setStatusOverrides(prev => ({ ...prev, ...newOverrides }));
      // Deselect confirmed ones
      setSelected(prev => {
        const next = new Set(prev);
        for (const [id, override] of Object.entries(newOverrides)) {
          if (override.status === 'remote_exists') next.delete(id);
        }
        return next;
      });

      const parts = [];
      if (foundCount > 0) parts.push(`${foundCount} confirmada(s) no SGE`);
      if (notFoundCount > 0) parts.push(`${notFoundCount} NAO encontrada(s) - precisam ser enviadas`);
      addToast(parts.join(', '), foundCount > 0 && notFoundCount === 0 ? 'success' : 'info');
    } catch (error) {
      console.error('Erro ao verificar SGE:', error);
      addToast('Erro ao verificar chamadas no SGE', 'error');
    } finally {
      setChecking(false);
    }
  };

  // Fetch e-aluno students and auto-match by name. Cache per turma key.
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
          user: config.credentials.user,
          password: config.credentials.password,
          serie: mapping.serie,
          turma: mapping.turma,
          turno: mapping.turno,
          ano,
          fetch: 'alunos',
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
      // Exact match
      let matched = eAlunoStudents!.find(ea => normalizeName(ea.nome) === normalizedName);

      // Partial match: first + last name
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

    // Persist new mappings
    if (newMappings > 0) {
      await eAlunoConfigService.saveAlunoMap(professor!.id, currentMap);
    }

    return currentMap;
  }, [professor, ano, eAlunoStudentsCache]);

  // Enviar selecionadas
  const handleEnviar = async () => {
    const config = await loadConfig();
    if (!config) return;

    const toSend = rows.filter(r => selected.has(r.chamada.id));
    if (toSend.length === 0) {
      addToast('Selecione pelo menos uma chamada', 'warning');
      return;
    }

    setSending(true);
    setProgress({ current: 0, total: toSend.length });
    setSummary(null);

    let sent = 0, existed = 0, failed = 0;

    for (let i = 0; i < toSend.length; i++) {
      const row = toSend[i];
      setProgress({ current: i + 1, total: toSend.length });
      setStatusOverrides(prev => ({ ...prev, [row.chamada.id]: { status: 'sending' } }));

      try {
        const latestConfig = await eAlunoConfigService.getByUser(professor!.id);
        let mapping = latestConfig ? resolveMapping(latestConfig, row.chamada) : null;
        if (!mapping && latestConfig) {
          mapping = await autoDiscoverMappings(latestConfig, row.chamada);
        }

        if (!mapping) {
          setStatusOverrides(prev => ({
            ...prev,
            [row.chamada.id]: { status: 'error', errorMsg: 'Mapeamento nao encontrado' },
          }));
          failed++;
          continue;
        }

        // Auto-match students by name if not yet mapped
        const alunoMap = await autoMatchStudents(
          latestConfig || config,
          mapping,
          row.chamada.presencas,
        );

        const presencasMap: Record<string, boolean> = {};
        for (const p of row.chamada.presencas) {
          if (alunoMap[p.alunoId]) {
            presencasMap[p.alunoId] = p.presente;
          }
        }

        if (Object.keys(presencasMap).length === 0) {
          setStatusOverrides(prev => ({
            ...prev,
            [row.chamada.id]: { status: 'error', errorMsg: 'Nenhum aluno mapeado' },
          }));
          failed++;
          continue;
        }

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
            data: toISODate(row.chamada.data),
            aula: row.chamada.tempo,
            alunoMap,
            presencas: presencasMap,
          }),
        });

        const result = await res.json();

        if (result.success) {
          await chamadaService.update(row.chamada.id, { sgeSyncedAt: new Date() });
          setStatusOverrides(prev => ({ ...prev, [row.chamada.id]: { status: 'synced' } }));
          sent++;
        } else {
          setStatusOverrides(prev => ({
            ...prev,
            [row.chamada.id]: { status: 'error', errorMsg: result.error || result.message },
          }));
          failed++;
        }
      } catch (error) {
        console.error('Erro ao enviar chamada:', error);
        setStatusOverrides(prev => ({
          ...prev,
          [row.chamada.id]: { status: 'error', errorMsg: 'Erro de conexao' },
        }));
        failed++;
      }
    }

    setSending(false);
    setSelected(new Set());
    setSummary({ sent, existed, failed });
    addToast(
      `Envio concluido: ${sent} enviada(s)${failed > 0 ? `, ${failed} falha(s)` : ''}`,
      failed > 0 ? 'warning' : 'success'
    );
  };

  const getStatusChip = (row: ChamadaRow) => {
    switch (row.status) {
      case 'synced':
        return <Chip label="Enviado" color="success" size="small" icon={<CheckIcon />} />;
      case 'remote_exists':
        return <Chip label="Confirmado SGE" color="info" size="small" icon={<CheckIcon />} />;
      case 'sending':
        return <Chip label="Enviando..." color="warning" size="small" />;
      case 'error':
        return <Chip label={row.errorMsg || 'Erro'} color="error" size="small" />;
      default:
        return <Chip label="Pendente" variant="outlined" size="small" />;
    }
  };

  const formatChamadaDate = (data: Date | string) => {
    const d = data instanceof Date ? data : new Date(data);
    const iso = d.toISOString().split('T')[0];
    return formatDate(iso);
  };

  const isWorking = checking || sending;
  const allSendableSelected = sendableRows.length > 0 && sendableRows.every(r => selected.has(r.chamada.id));

  return (
    <Box>
      {/* Actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={handleVerificar}
            disabled={isWorking || unverifiedRows.length === 0}
            size="small"
          >
            Verificar SGE ({unverifiedRows.length})
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleSelectAll(!allSendableSelected)}
            disabled={isWorking || sendableRows.length === 0}
          >
            {allSendableSelected ? 'Desmarcar todas' : 'Selecionar todas'}
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleEnviar}
            disabled={isWorking || selected.size === 0}
            size="small"
          >
            Enviar selecionadas ({selected.size})
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ ml: { sm: 'auto' } }}>
            {rows.length} chamada(s) | {unverifiedRows.filter(r => r.status === 'pending').length} pendente(s)
          </Typography>
        </Stack>

        {isWorking && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {checking ? 'Verificando' : 'Enviando'} {progress.current}/{progress.total}...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Summary */}
      {summary && (
        <Alert
          severity={summary.failed > 0 ? 'warning' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => setSummary(null)}
        >
          Resultado: {summary.sent} enviada(s)
          {summary.existed > 0 && `, ${summary.existed} ja existiam`}
          {summary.failed > 0 && `, ${summary.failed} falha(s)`}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSendableSelected && sendableRows.length > 0}
                  indeterminate={selected.size > 0 && !allSendableSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  disabled={isWorking || sendableRows.length === 0}
                />
              </TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Turma</TableCell>
              <TableCell>Disciplina</TableCell>
              <TableCell align="center">Tempo</TableCell>
              <TableCell align="center">Presentes</TableCell>
              <TableCell>Status SGE</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isItemSelected = selected.has(row.chamada.id);
              // All rows selectable except "Confirmado SGE" (verified remotely) and currently sending
              const canSelect = row.status !== 'remote_exists' && row.status !== 'sending';

              return (
                <TableRow
                  key={row.chamada.id}
                  hover
                  selected={isItemSelected}
                  sx={{ opacity: row.status === 'sending' ? 0.6 : 1 }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isItemSelected}
                      onChange={() => handleToggle(row.chamada.id)}
                      disabled={isWorking || !canSelect}
                    />
                  </TableCell>
                  <TableCell>{formatChamadaDate(row.chamada.data)}</TableCell>
                  <TableCell>{row.turmaNome}</TableCell>
                  <TableCell>{row.disciplinaNome}</TableCell>
                  <TableCell align="center">T{row.chamada.tempo}</TableCell>
                  <TableCell align="center">{row.presentes}/{row.total}</TableCell>
                  <TableCell>{getStatusChip(row)}</TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Nenhuma chamada no periodo</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
