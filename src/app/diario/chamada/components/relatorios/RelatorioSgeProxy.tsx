/**
 * RelatorioSgeProxy - Mostra dados do LUMINAR no formato identico ao SGE.
 * Carrega chamadas e conteudos do Firestore e exibe como o SGE mostraria.
 *
 * Tipos:
 * - chamadas_dia: Lista de chamadas registradas num dia (Data | Qtde Aula | Conteudo?)
 * - detalhamento: Presenca por aluno para uma data (Nº | Nome | T1 T2 T3... | Total)
 * - mensal: Resumo mensal (Data | Qtde Aula | Conteudo?)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Print as PrintIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario, ConteudoAula } from '@/types';
import { chamadaService, conteudoAulaService } from '@/services/firestore';
import { useFilterStore } from '@/store/filterStore';
import { useUIStore } from '@/store/uiStore';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatDate, printReport } from './utils';

type SgeProxyTipo = 'chamadas_dia' | 'detalhamento' | 'mensal';

interface RelatorioSgeProxyProps {
  tipo: SgeProxyTipo;
  turmas: Turma[];
  disciplinas: Disciplina[];
  professor: Usuario | null;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function getToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toISODate(data: Date | unknown): string {
  const d = data instanceof Date ? data : new Date(data as string | number);
  return d.toISOString().split('T')[0];
}

export function RelatorioSgeProxy({ tipo, turmas, disciplinas, professor }: RelatorioSgeProxyProps) {
  const { ano } = useFilterStore();

  // Filters
  const [turmaId, setTurmaId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [data, setData] = useState(getToday);
  const [mes, setMes] = useState(new Date().getMonth());

  // State
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [conteudos, setConteudos] = useState<ConteudoAula[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Edit/Delete state
  const [editing, setEditing] = useState(false);
  const [editedPresencas, setEditedPresencas] = useState<Map<string, boolean>>(new Map());
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[]; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const { addToast } = useUIStore();
  const turmaNome = turmas.find(t => t.id === turmaId)?.nome || '';
  const discNome = disciplinas.find(d => d.id === disciplinaId)?.nome || '';

  const canGenerate = tipo === 'chamadas_dia' ? !!turmaId : !!(turmaId && disciplinaId);

  // Load data from Firestore
  const loadData = useCallback(async () => {
    if (!professor?.id || !turmaId) return;
    if (tipo !== 'chamadas_dia' && !disciplinaId) return;

    setLoading(true);
    try {
      if (tipo === 'mensal') {
        // Load entire month
        const startDate = new Date(ano, mes, 1);
        const endDate = new Date(ano, mes + 1, 0, 23, 59, 59);
        const all = await chamadaService.getByProfessorPeriodo(professor.id, startDate, endDate);
        const filtered = all.filter(c => c.turmaId === turmaId && c.disciplinaId === disciplinaId);
        setChamadas(filtered);

        // Load conteudos for the month
        const conteudoData = await conteudoAulaService.getByProfessorAndPeriod(professor.id, ano, startDate, endDate);
        const filteredConteudos = conteudoData.filter(c => c.turmaId === turmaId && c.disciplinaId === disciplinaId);
        setConteudos(filteredConteudos);
      } else {
        // Load single day
        const dateObj = new Date(data + 'T12:00:00');
        const all = await chamadaService.getByProfessorData(professor.id, dateObj);
        if (tipo === 'chamadas_dia') {
          // Show all disciplines for this turma on this day
          setChamadas(all.filter(c => c.turmaId === turmaId));
        } else {
          // Detalhamento: filter by turma+disciplina
          setChamadas(all.filter(c => c.turmaId === turmaId && c.disciplinaId === disciplinaId));
        }
        setConteudos([]);
      }
      setLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  }, [professor?.id, turmaId, disciplinaId, tipo, data, mes, ano]);

  // Reset loaded state when filters change
  useEffect(() => {
    setLoaded(false);
    setEditing(false);
    setEditedPresencas(new Map());
  }, [turmaId, disciplinaId, data, mes]);

  // ==================== CHAMADAS DO DIA ====================
  const chamadasDiaRows = useMemo(() => {
    if (tipo !== 'chamadas_dia') return [];

    // Group by disciplina
    const groups = new Map<string, { discId: string; discNome: string; tempos: number; hasConteudo: boolean; chamadaIds: string[] }>();
    for (const c of chamadas) {
      const disc = disciplinas.find(d => d.id === c.disciplinaId);
      const key = c.disciplinaId;
      const existing = groups.get(key);
      if (existing) {
        existing.tempos++;
        existing.chamadaIds.push(c.id);
        if (c.conteudo) existing.hasConteudo = true;
      } else {
        groups.set(key, {
          discId: c.disciplinaId,
          discNome: disc?.nome || c.disciplinaId,
          tempos: 1,
          hasConteudo: !!c.conteudo,
          chamadaIds: [c.id],
        });
      }
    }
    return Array.from(groups.values());
  }, [tipo, chamadas, disciplinas]);

  // ==================== DETALHAMENTO DA CHAMADA ====================
  const detalhamentoData = useMemo(() => {
    if (tipo !== 'detalhamento') return {
      students: [] as Array<{ alunoId: string; nome: string; tempos: Record<number, boolean> }>,
      tempoNumbers: [] as number[],
      chamadasByTempo: new Map<number, Chamada>(),
    };

    const tempoNumbers = [...new Set(chamadas.map(c => c.tempo))].sort();
    const studentMap = new Map<string, { alunoId: string; nome: string; tempos: Record<number, boolean> }>();
    const chamadasByTempo = new Map<number, Chamada>();

    for (const c of chamadas) {
      chamadasByTempo.set(c.tempo, c);
      for (const p of c.presencas) {
        let student = studentMap.get(p.alunoId);
        if (!student) {
          student = { alunoId: p.alunoId, nome: p.alunoNome, tempos: {} };
          studentMap.set(p.alunoId, student);
        }
        student.tempos[c.tempo] = p.presente;
      }
    }

    const students = Array.from(studentMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));
    return { students, tempoNumbers, chamadasByTempo };
  }, [tipo, chamadas]);

  // ==================== DETALHAMENTO DO MES ====================
  const mensalRows = useMemo(() => {
    if (tipo !== 'mensal') return [];

    // Group chamadas by date
    const groups = new Map<string, { date: string; tempos: number; conteudoIds: Set<string>; chamadaIds: string[] }>();
    for (const c of chamadas) {
      const dateStr = toISODate(c.data);
      const existing = groups.get(dateStr);
      if (existing) {
        existing.tempos++;
        existing.chamadaIds.push(c.id);
      } else {
        groups.set(dateStr, { date: dateStr, tempos: 1, conteudoIds: new Set(), chamadaIds: [c.id] });
      }
    }

    // Check conteudos
    for (const ct of conteudos) {
      const dateStr = toISODate(ct.data);
      const group = groups.get(dateStr);
      if (group) {
        group.conteudoIds.add(ct.id);
      }
    }

    // Also check inline conteudo field on chamadas
    for (const c of chamadas) {
      if (c.conteudo) {
        const dateStr = toISODate(c.data);
        const group = groups.get(dateStr);
        if (group) group.conteudoIds.add('inline-' + c.id);
      }
    }

    return Array.from(groups.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [tipo, chamadas, conteudos]);

  const totalAulas = mensalRows.reduce((sum, r) => sum + r.tempos, 0);

  // ==================== DELETE HANDLER ====================
  const handleDeleteChamadas = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      for (const id of deleteConfirm.ids) {
        await chamadaService.delete(id);
      }
      addToast(`${deleteConfirm.ids.length} chamada(s) excluida(s)`, 'success');
      setDeleteConfirm(null);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      addToast('Erro ao excluir chamadas', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ==================== EDIT PRESENCAS HANDLERS ====================
  const handleTogglePresenca = (tempo: number, alunoId: string, originalValue: boolean) => {
    const key = `${tempo}|${alunoId}`;
    setEditedPresencas(prev => {
      const next = new Map(prev);
      const currentDisplayed = next.has(key) ? next.get(key)! : originalValue;
      const newValue = !currentDisplayed;
      if (newValue === originalValue) {
        next.delete(key);
      } else {
        next.set(key, newValue);
      }
      return next;
    });
  };

  const handleSavePresencas = async () => {
    if (editedPresencas.size === 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const editsByTempo = new Map<number, Map<string, boolean>>();
      for (const [key, value] of editedPresencas) {
        const sepIdx = key.indexOf('|');
        const tempo = parseInt(key.substring(0, sepIdx));
        const alunoId = key.substring(sepIdx + 1);
        let tempoEdits = editsByTempo.get(tempo);
        if (!tempoEdits) {
          tempoEdits = new Map();
          editsByTempo.set(tempo, tempoEdits);
        }
        tempoEdits.set(alunoId, value);
      }

      for (const [tempo, studentEdits] of editsByTempo) {
        const chamada = detalhamentoData.chamadasByTempo.get(tempo);
        if (!chamada) continue;
        const newPresencas = chamada.presencas.map(p => {
          const edit = studentEdits.get(p.alunoId);
          return edit !== undefined ? { ...p, presente: edit } : p;
        });
        await chamadaService.update(chamada.id, { presencas: newPresencas });
      }

      addToast('Presencas atualizadas com sucesso', 'success');
      setEditing(false);
      setEditedPresencas(new Map());
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      addToast('Erro ao salvar presencas', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditedPresencas(new Map());
  };

  // ==================== PRINT ====================
  const handlePrint = () => {
    let content = '';
    const tipoLabel = tipo === 'chamadas_dia' ? 'Chamada(s) do Dia'
      : tipo === 'detalhamento' ? 'Detalhamento da Chamada'
      : 'Detalhamento do Mes';

    if (tipo === 'chamadas_dia') {
      content = `<table><thead><tr><th>Disciplina</th><th>Qtde Aula</th><th>Conteudo?</th></tr></thead><tbody>`;
      for (const row of chamadasDiaRows) {
        content += `<tr><td>${row.discNome}</td><td style="text-align:center">${row.tempos}</td><td style="text-align:center">${row.hasConteudo ? 'SIM' : 'NAO'}</td></tr>`;
      }
      const total = chamadasDiaRows.reduce((s, r) => s + r.tempos, 0);
      content += `</tbody><tfoot><tr><td><strong>Total</strong></td><td style="text-align:center"><strong>${total}</strong></td><td></td></tr></tfoot></table>`;
    } else if (tipo === 'detalhamento') {
      const { students, tempoNumbers } = detalhamentoData;
      content = `<table><thead><tr><th>Nº</th><th>Nome do Aluno</th>`;
      for (const t of tempoNumbers) content += `<th style="text-align:center">T${t}</th>`;
      content += `</tr></thead><tbody>`;
      students.forEach((s, i) => {
        content += `<tr><td>${i + 1}</td><td>${s.nome}</td>`;
        for (const t of tempoNumbers) {
          const status = s.tempos[t] === undefined ? '-' : s.tempos[t] ? 'P' : 'F';
          const cls = s.tempos[t] ? 'presente' : s.tempos[t] === false ? 'ausente' : '';
          content += `<td style="text-align:center" class="${cls}">${status}</td>`;
        }
        content += `</tr>`;
      });
      content += `</tbody></table>`;
    } else {
      content = `<table><thead><tr><th>Data</th><th>Qtde Aula</th><th>Conteudo?</th></tr></thead><tbody>`;
      for (const row of mensalRows) {
        content += `<tr><td>${formatDate(row.date)}</td><td style="text-align:center">${row.tempos}</td><td style="text-align:center">${row.conteudoIds.size > 0 ? 'SIM' : 'NAO'}</td></tr>`;
      }
      content += `</tbody><tfoot><tr><td><strong>Total</strong></td><td style="text-align:center"><strong>${totalAulas}</strong></td><td></td></tr></tfoot></table>`;
    }

    printReport({
      title: tipoLabel,
      subtitle: tipo === 'mensal' ? `${MESES[mes]} / ${ano}` : formatDate(data),
      professor: professor?.nome,
      periodo: `${turmaNome} - ${discNome}`,
      content,
    });
  };

  // ==================== RENDER ====================
  const tipoLabel = tipo === 'chamadas_dia'
    ? 'Chamada(s) do Dia'
    : tipo === 'detalhamento'
      ? 'Detalhamento da Chamada'
      : 'Detalhamento do Mes';

  const needsDate = tipo === 'chamadas_dia' || tipo === 'detalhamento';
  const needsMonth = tipo === 'mensal';
  // chamadas_dia shows all disciplines for a turma, so only need turma
  const needsDisciplina = tipo !== 'chamadas_dia';

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Filtros
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel>Turma</InputLabel>
            <Select value={turmaId} label="Turma" onChange={(e) => setTurmaId(e.target.value)}>
              <MenuItem value=""><em>Selecione</em></MenuItem>
              {turmas.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {needsDisciplina && (
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel>Disciplina</InputLabel>
              <Select value={disciplinaId} label="Disciplina" onChange={(e) => setDisciplinaId(e.target.value)}>
                <MenuItem value=""><em>Selecione</em></MenuItem>
                {disciplinas.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {needsDate && (
            <TextField
              label="Data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: { xs: '100%', sm: 150 } }}
            />
          )}

          {needsMonth && (
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
              <InputLabel>Mes</InputLabel>
              <Select value={mes} label="Mes" onChange={(e) => setMes(e.target.value as number)}>
                {MESES.map((m, i) => (
                  <MenuItem key={i} value={i}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            variant="contained"
            onClick={loadData}
            disabled={!canGenerate || loading}
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {loading ? <CircularProgress size={20} /> : 'Gerar Relatorio'}
          </Button>
        </Box>
      </Paper>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Chamadas do Dia */}
      {loaded && !loading && tipo === 'chamadas_dia' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {turmaNome} — {formatDate(data)}
            </Typography>
            {chamadasDiaRows.length > 0 && (
              <Button size="small" startIcon={<PrintIcon />} onClick={handlePrint}>Imprimir</Button>
            )}
          </Box>
          {chamadasDiaRows.length === 0 ? (
            <Alert severity="info">Nenhuma chamada registrada para esta turma neste dia.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell><strong>Disciplina</strong></TableCell>
                    <TableCell align="center"><strong>Qtde Aula</strong></TableCell>
                    <TableCell align="center"><strong>Conteudo?</strong></TableCell>
                    <TableCell align="center" sx={{ width: 60 }}><strong>Acao</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {chamadasDiaRows.map((row) => (
                    <TableRow key={row.discId}>
                      <TableCell>{row.discNome}</TableCell>
                      <TableCell align="center">{row.tempos}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.hasConteudo ? 'SIM' : 'NAO'}
                          color={row.hasConteudo ? 'success' : 'default'}
                          size="small"
                          variant={row.hasConteudo ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={`Excluir ${row.tempos} chamada(s) de ${row.discNome}`}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirm({
                              ids: row.chamadaIds,
                              label: `${row.discNome} - ${formatDate(data)} (${row.tempos} aula(s))`,
                            })}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell align="center">
                      <strong>{chamadasDiaRows.reduce((s, r) => s + r.tempos, 0)}</strong>
                    </TableCell>
                    <TableCell />
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Detalhamento da Chamada */}
      {loaded && !loading && tipo === 'detalhamento' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {turmaNome} — {discNome} — {formatDate(data)}
            </Typography>
            {detalhamentoData.students.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {editing ? (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                      onClick={handleSavePresencas}
                      disabled={saving || editedPresencas.size === 0}
                    >
                      Salvar ({editedPresencas.size})
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CloseIcon />}
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => setEditing(true)}>
                      Editar
                    </Button>
                    <Button size="small" startIcon={<PrintIcon />} onClick={handlePrint}>Imprimir</Button>
                  </>
                )}
              </Box>
            )}
          </Box>
          {editing && (
            <Alert severity="info" sx={{ mb: 1 }}>
              Clique nas celulas P/F para alterar a presenca. Depois clique em Salvar.
            </Alert>
          )}
          {detalhamentoData.students.length === 0 ? (
            <Alert severity="info">Nenhuma chamada registrada para esta turma/disciplina neste dia.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ width: 40 }}><strong>N</strong></TableCell>
                    <TableCell><strong>Nome do Aluno</strong></TableCell>
                    {detalhamentoData.tempoNumbers.map(t => (
                      <TableCell key={t} align="center" sx={{ width: 50 }}>
                        <strong>T{t}</strong>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalhamentoData.students.map((student, i) => (
                    <TableRow key={student.alunoId}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{student.nome}</TableCell>
                      {detalhamentoData.tempoNumbers.map(t => {
                        const originalPresente = student.tempos[t];
                        const editKey = `${t}|${student.alunoId}`;
                        const displayedPresente = editedPresencas.has(editKey)
                          ? editedPresencas.get(editKey)!
                          : originalPresente;
                        const isEdited = editedPresencas.has(editKey);

                        if (originalPresente === undefined) {
                          return (
                            <TableCell key={t} align="center">
                              <Typography variant="body2" color="text.disabled">-</Typography>
                            </TableCell>
                          );
                        }

                        return (
                          <TableCell
                            key={t}
                            align="center"
                            onClick={editing ? () => handleTogglePresenca(t, student.alunoId, originalPresente) : undefined}
                            sx={editing ? {
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' },
                              ...(isEdited ? { bgcolor: 'warning.50', outline: '2px solid', outlineColor: 'warning.main' } : {}),
                            } : undefined}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={displayedPresente ? 'success.main' : 'error.main'}
                            >
                              {displayedPresente ? 'P' : 'F'}
                            </Typography>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2}><strong>Resumo</strong></TableCell>
                    {detalhamentoData.tempoNumbers.map(t => {
                      const present = detalhamentoData.students.filter(s => {
                        const editKey = `${t}|${s.alunoId}`;
                        const val = editedPresencas.has(editKey) ? editedPresencas.get(editKey)! : s.tempos[t];
                        return val === true;
                      }).length;
                      const total = detalhamentoData.students.filter(s => s.tempos[t] !== undefined).length;
                      return (
                        <TableCell key={t} align="center">
                          <Typography variant="caption" fontWeight={600}>
                            {present}/{total}
                          </Typography>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Detalhamento do Mes */}
      {loaded && !loading && tipo === 'mensal' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {turmaNome} — {discNome} — {MESES[mes]} / {ano}
            </Typography>
            {mensalRows.length > 0 && (
              <Button size="small" startIcon={<PrintIcon />} onClick={handlePrint}>Imprimir</Button>
            )}
          </Box>
          {mensalRows.length === 0 ? (
            <Alert severity="info">Nenhuma chamada registrada para este mes.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell><strong>Data</strong></TableCell>
                    <TableCell align="center"><strong>Qtde Aula</strong></TableCell>
                    <TableCell align="center"><strong>Conteudo?</strong></TableCell>
                    <TableCell align="center" sx={{ width: 60 }}><strong>Acao</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mensalRows.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell align="center">{row.tempos}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.conteudoIds.size > 0 ? 'SIM' : 'NAO'}
                          color={row.conteudoIds.size > 0 ? 'success' : 'default'}
                          size="small"
                          variant={row.conteudoIds.size > 0 ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={`Excluir ${row.tempos} chamada(s) de ${formatDate(row.date)}`}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirm({
                              ids: row.chamadaIds,
                              label: `${formatDate(row.date)} (${row.tempos} aula(s))`,
                            })}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell align="center"><strong>{totalAulas}</strong></TableCell>
                    <TableCell />
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Hint */}
      {!loaded && !loading && (
        <Alert severity="info">
          Selecione os filtros e clique em &quot;Gerar Relatorio&quot;.
        </Alert>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteChamadas}
        title="Excluir Chamada(s)"
        message={`Tem certeza que deseja excluir as chamadas de ${deleteConfirm?.label || ''}? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
      />
    </Box>
  );
}
