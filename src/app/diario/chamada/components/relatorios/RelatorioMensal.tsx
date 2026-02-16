/**
 * Relatorio Mensal - Espelha "Detalhamento do mes" do SGE.
 * Mostra chamadas agrupadas por dia com qtd de aulas, conteudo e status SGE.
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
  TableFooter,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario, EAlunoConfig } from '@/types';
import { chamadaService, eAlunoConfigService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';
import { formatDate } from './utils';

const MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface RelatorioMensalProps {
  turmaId: string;
  disciplinaId: string;
  mes: number; // 0-11
  ano: number;
  turmas: Turma[];
  disciplinas: Disciplina[];
  professor: Usuario | null;
}

interface DiaAgrupado {
  dataStr: string; // YYYY-MM-DD
  chamadas: Chamada[];
  qtdAulas: number;
  conteudos: string[];
  sgeStatus: 'sincronizado' | 'parcial' | 'pendente';
}

export function RelatorioMensal({
  turmaId,
  disciplinaId,
  mes,
  ano,
  turmas,
  disciplinas,
  professor,
}: RelatorioMensalProps) {
  const { addToast } = useUIStore();
  const [diasAgrupados, setDiasAgrupados] = useState<DiaAgrupado[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [eAlunoConfig, setEAlunoConfig] = useState<EAlunoConfig | null>(null);

  const turma = turmas.find(t => t.id === turmaId);
  const disciplina = disciplinas.find(d => d.id === disciplinaId);

  // Load eAluno config for URL building
  useEffect(() => {
    if (professor?.id) {
      eAlunoConfigService.getByUser(professor.id).then(setEAlunoConfig).catch(() => {});
    }
  }, [professor?.id]);

  // Load and group chamadas
  const loadChamadas = useCallback(async () => {
    if (!turmaId || !disciplinaId) return;
    setLoading(true);
    try {
      const all = await chamadaService.getByTurmaAno(turmaId, ano);
      const filtered = all.filter(c => {
        if (c.disciplinaId !== disciplinaId) return false;
        const d = c.data instanceof Date ? c.data : new Date(c.data as unknown as string);
        return d.getMonth() === mes;
      });

      // Group by day
      const groupMap = new Map<string, Chamada[]>();
      for (const chamada of filtered) {
        const d = chamada.data instanceof Date ? chamada.data : new Date(chamada.data as unknown as string);
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const existing = groupMap.get(dayKey) || [];
        existing.push(chamada);
        groupMap.set(dayKey, existing);
      }

      // Convert to sorted array
      const dias: DiaAgrupado[] = Array.from(groupMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dataStr, chamadas]) => {
          const sorted = chamadas.sort((a, b) => a.tempo - b.tempo);
          const conteudos = sorted
            .map(c => c.conteudo)
            .filter((c): c is string => !!c);

          const totalTempos = sorted.length;
          const syncedTempos = sorted.filter(c => !!c.sgeSyncedAt).length;

          let sgeStatus: DiaAgrupado['sgeStatus'] = 'pendente';
          if (syncedTempos === totalTempos) sgeStatus = 'sincronizado';
          else if (syncedTempos > 0) sgeStatus = 'parcial';

          return {
            dataStr,
            chamadas: sorted,
            qtdAulas: totalTempos,
            conteudos,
            sgeStatus,
          };
        });

      setDiasAgrupados(dias);
      setLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar chamadas:', error);
      addToast('Erro ao carregar chamadas do mes', 'error');
    } finally {
      setLoading(false);
    }
  }, [turmaId, disciplinaId, mes, ano, addToast]);

  // Build SGE URL for a day
  const getSgeUrl = (dataStr: string) => {
    const turmaMapping = eAlunoConfig?.turmaMap?.[turmaId];
    const disciplinaMapping = eAlunoConfig?.disciplinaMap?.[disciplinaId];

    if (!turmaMapping || !disciplinaMapping) {
      return 'https://e-aluno.com.br/christ/diario/relatorio_detalhamento_mensal.php';
    }

    const params = new URLSearchParams({
      serie: String(turmaMapping.serie),
      turma: String(turmaMapping.turma),
      turno: turmaMapping.turno,
      disciplina: String(disciplinaMapping),
      mes: String(mes + 1),
      txtMes: MESES[mes],
      txtSerie: turma?.nome || '',
      ano: String(ano),
    });

    return `https://e-aluno.com.br/christ/diario/relatorio_detalhamento_mensal.php?${params.toString()}`;
  };

  // Reload when key props change
  useEffect(() => {
    if (turmaId && disciplinaId) {
      loadChamadas();
    }
  }, [turmaId, disciplinaId, mes, ano, loadChamadas]);

  // Totals
  const totalDias = diasAgrupados.length;
  const totalAulas = diasAgrupados.reduce((sum, d) => sum + d.qtdAulas, 0);
  const totalSincronizado = diasAgrupados.filter(d => d.sgeStatus === 'sincronizado').length;
  const percSincronizado = totalDias > 0 ? Math.round((totalSincronizado / totalDias) * 100) : 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loaded && diasAgrupados.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Nenhuma chamada registrada para {turma?.nome || 'esta turma'} - {disciplina?.nome || 'esta disciplina'} em {MESES[mes]} de {ano}.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">
          {turma?.nome} - {disciplina?.nome} - {MESES[mes]} de {ano}
        </Typography>
      </Box>

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ width: 120 }}>Data</TableCell>
                <TableCell align="center" sx={{ width: 100 }}>Qtd Aulas</TableCell>
                <TableCell>Conteudo</TableCell>
                <TableCell align="center" sx={{ width: 130 }}>Status SGE</TableCell>
                <TableCell align="center" sx={{ width: 60 }}>Ver SGE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {diasAgrupados.map((dia) => (
                <TableRow key={dia.dataStr} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDate(dia.dataStr)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={dia.qtdAulas} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }} noWrap>
                      {dia.conteudos.length > 0 ? dia.conteudos.join('; ') : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={
                        dia.sgeStatus === 'sincronizado'
                          ? 'Sincronizado'
                          : dia.sgeStatus === 'parcial'
                            ? 'Parcial'
                            : 'Pendente'
                      }
                      size="small"
                      color={
                        dia.sgeStatus === 'sincronizado'
                          ? 'success'
                          : dia.sgeStatus === 'parcial'
                            ? 'warning'
                            : 'default'
                      }
                      variant={dia.sgeStatus === 'pendente' ? 'outlined' : 'filled'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => window.open(getSgeUrl(dia.dataStr), '_blank')}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>
                  <Typography variant="subtitle2">Total: {totalDias} dias</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle2">{totalAulas}</Typography>
                </TableCell>
                <TableCell />
                <TableCell align="center">
                  <Typography variant="caption" color="text.secondary">
                    {percSincronizado}% sincronizado
                  </Typography>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
