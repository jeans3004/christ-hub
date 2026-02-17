/**
 * Componente principal de Relatorios de Chamada.
 * Permite ao professor escolher entre diferentes tipos de relatorio.
 * 3 relatorios SGE (espelho do dia, consultar dia, mensal) + 4 Luminar.
 */

import { useState, useEffect, useCallback } from 'react';
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
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Today as TodayIcon,
  DateRange as PeriodIcon,
  Warning as FaltasIcon,
  Class as TurmaIcon,
  Assessment as ConsolidadoIcon,
  Search as SearchIcon,
  CalendarMonth as CalendarMonthIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon,
  DeleteForever as DeleteForeverIcon,
  Visibility as VisibilityIcon,
  ListAlt as ListAltIcon,
  Summarize as SummarizeIcon,
} from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario, EAlunoConfig } from '@/types';
import { chamadaService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';

import { RelatorioDia } from './relatorios/RelatorioDia';
import { RelatorioPeriodo } from './relatorios/RelatorioPeriodo';
import { RelatorioFaltas } from './relatorios/RelatorioFaltas';
import { RelatorioTurma } from './relatorios/RelatorioTurma';
import { RelatorioConsolidado } from './relatorios/RelatorioConsolidado';
import { RelatorioConsultaDia } from './relatorios/RelatorioConsultaDia';
import { RelatorioMensal } from './relatorios/RelatorioMensal';
import { RelatorioSyncAll } from './relatorios/RelatorioSyncAll';
import { RelatorioDeleteAll } from './relatorios/RelatorioDeleteAll';
import { RelatorioSgeProxy } from './relatorios/RelatorioSgeProxy';

type TipoRelatorio = 'dia' | 'consultar_dia' | 'mensal' | 'sync_all' | 'delete_all' | 'sge_chamadas_dia' | 'sge_detalhamento' | 'sge_mensal' | 'periodo' | 'faltas' | 'turma' | 'consolidado' | null;

interface RelatoriosChamadaProps {
  professor: Usuario | null;
  turmas: Turma[];
  disciplinas: Disciplina[];
  eAlunoConfig: EAlunoConfig | null;
  onConfigureSGE: () => void;
}

const TIPOS_RELATORIO = [
  {
    id: 'dia' as TipoRelatorio,
    titulo: 'Espelho do Dia',
    descricao: 'Todas as chamadas de um dia com status SGE',
    icon: TodayIcon,
    color: 'primary',
    grupo: 'sge',
  },
  {
    id: 'consultar_dia' as TipoRelatorio,
    titulo: 'Consultar Dia',
    descricao: 'Detalhamento da chamada por aluno com comparacao SGE',
    icon: SearchIcon,
    color: 'secondary',
    grupo: 'sge',
  },
  {
    id: 'mensal' as TipoRelatorio,
    titulo: 'Detalhamento do Mes',
    descricao: 'Resumo mensal com aulas, conteudo e status SGE',
    icon: CalendarMonthIcon,
    color: 'info',
    grupo: 'sge',
  },
  {
    id: 'sync_all' as TipoRelatorio,
    titulo: 'Sincronizar Tudo',
    descricao: 'Enviar todas as chamadas pendentes ao SGE de uma vez',
    icon: CloudUploadIcon,
    color: 'warning',
    grupo: 'sge',
  },
  {
    id: 'delete_all' as TipoRelatorio,
    titulo: 'Excluir Tudo do SGE',
    descricao: 'Remover todas as chamadas enviadas do SGE',
    icon: DeleteForeverIcon,
    color: 'error',
    grupo: 'sge',
  },
  {
    id: 'sge_chamadas_dia' as TipoRelatorio,
    titulo: 'Chamada(s) do Dia',
    descricao: 'Visualizar chamada do dia direto do SGE',
    icon: VisibilityIcon,
    color: 'primary',
    grupo: 'sge_direto',
  },
  {
    id: 'sge_detalhamento' as TipoRelatorio,
    titulo: 'Detalhamento da Chamada',
    descricao: 'Detalhamento por aluno direto do SGE',
    icon: ListAltIcon,
    color: 'secondary',
    grupo: 'sge_direto',
  },
  {
    id: 'sge_mensal' as TipoRelatorio,
    titulo: 'Detalhamento do Mes',
    descricao: 'Relatorio mensal direto do SGE',
    icon: SummarizeIcon,
    color: 'info',
    grupo: 'sge_direto',
  },
  {
    id: 'periodo' as TipoRelatorio,
    titulo: 'Relatorio por Periodo',
    descricao: 'Chamadas de um periodo (semana, mes)',
    icon: PeriodIcon,
    color: 'info',
    grupo: 'luminar',
  },
  {
    id: 'faltas' as TipoRelatorio,
    titulo: 'Relatorio de Faltas',
    descricao: 'Alunos com mais faltas no periodo',
    icon: FaltasIcon,
    color: 'error',
    grupo: 'luminar',
  },
  {
    id: 'turma' as TipoRelatorio,
    titulo: 'Relatorio por Turma',
    descricao: 'Historico de uma turma especifica',
    icon: TurmaIcon,
    color: 'success',
    grupo: 'luminar',
  },
  {
    id: 'consolidado' as TipoRelatorio,
    titulo: 'Relatorio Consolidado',
    descricao: 'Resumo geral de todas as turmas',
    icon: ConsolidadoIcon,
    color: 'warning',
    grupo: 'luminar',
  },
];

const MESES_OPTIONS = [
  { value: 0, label: 'Janeiro' },
  { value: 1, label: 'Fevereiro' },
  { value: 2, label: 'Marco' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Maio' },
  { value: 5, label: 'Junho' },
  { value: 6, label: 'Julho' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Setembro' },
  { value: 9, label: 'Outubro' },
  { value: 10, label: 'Novembro' },
  { value: 11, label: 'Dezembro' },
];

export function RelatoriosChamada({
  professor,
  turmas,
  disciplinas,
  eAlunoConfig,
  onConfigureSGE,
}: RelatoriosChamadaProps) {
  const { addToast } = useUIStore();

  // Estado do tipo de relatorio selecionado
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>(null);

  // Filtros
  const getToday = () => {
    try {
      return new Date().toISOString().split('T')[0];
    } catch {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  };
  const [dataInicio, setDataInicio] = useState(getToday);
  const [dataFim, setDataFim] = useState(getToday);
  const [turmaId, setTurmaId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());

  // Dados carregados
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [loading, setLoading] = useState(false);

  // Validar se uma string de data e valida
  const isValidDate = (dateStr: string): boolean => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const date = new Date(dateStr + 'T12:00:00');
    return !isNaN(date.getTime());
  };

  // Needs turma+disciplina filters
  const needsTurmaDisciplina = tipoRelatorio === 'consultar_dia' || tipoRelatorio === 'mensal';
  // Needs data range
  const needsDataRange = tipoRelatorio === 'periodo' || tipoRelatorio === 'faltas' || tipoRelatorio === 'turma' || tipoRelatorio === 'consolidado';
  // Needs single date
  const needsSingleDate = tipoRelatorio === 'dia' || tipoRelatorio === 'consultar_dia';
  // Needs month
  const needsMonth = tipoRelatorio === 'mensal';
  // Needs turma only
  const needsTurmaOnly = tipoRelatorio === 'turma';
  // Self-managed relatorios (load data internally)
  const isSgeProxy = tipoRelatorio === 'sge_chamadas_dia' || tipoRelatorio === 'sge_detalhamento' || tipoRelatorio === 'sge_mensal';
  const isSelfManaged = tipoRelatorio === 'consultar_dia' || tipoRelatorio === 'mensal' || tipoRelatorio === 'sync_all' || tipoRelatorio === 'delete_all' || isSgeProxy;

  // Handle card selection - reset data to today for 'dia'
  const handleSelectTipo = (tipo: TipoRelatorio) => {
    if (tipo === 'dia' || tipo === 'consultar_dia') {
      setDataInicio(getToday());
    }
    setTipoRelatorio(tipo);
    setChamadas([]);
  };

  // Carregar dados do relatorio
  const loadRelatorio = useCallback(async () => {
    if (!professor?.id || !tipoRelatorio || isSelfManaged) return;

    if (!isValidDate(dataInicio)) {
      addToast('Data invalida', 'error');
      return;
    }

    if (needsDataRange && !isValidDate(dataFim)) {
      addToast('Data fim invalida', 'error');
      return;
    }

    setLoading(true);
    try {
      let data: Chamada[] = [];

      switch (tipoRelatorio) {
        case 'dia':
          data = await chamadaService.getByProfessorData(
            professor.id,
            new Date(dataInicio + 'T12:00:00')
          );
          break;

        case 'periodo':
        case 'faltas':
        case 'consolidado':
          data = await chamadaService.getByProfessorPeriodo(
            professor.id,
            new Date(dataInicio + 'T00:00:00'),
            new Date(dataFim + 'T23:59:59')
          );
          break;

        case 'turma':
          if (turmaId) {
            const todasChamadas = await chamadaService.getByProfessorPeriodo(
              professor.id,
              new Date(dataInicio + 'T00:00:00'),
              new Date(dataFim + 'T23:59:59')
            );
            data = todasChamadas.filter(c => c.turmaId === turmaId);
          }
          break;
      }

      setChamadas(data);
    } catch (error) {
      console.error('Erro ao carregar relatorio:', error);
      addToast('Erro ao carregar relatorio', 'error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professor?.id, tipoRelatorio, dataInicio, dataFim, turmaId, addToast]);

  // Carregar ao mudar filtros (only for non-self-managed)
  useEffect(() => {
    if (tipoRelatorio && !isSelfManaged) {
      loadRelatorio();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoRelatorio, loadRelatorio]);

  // Voltar para selecao de tipo
  const handleVoltar = () => {
    setTipoRelatorio(null);
    setChamadas([]);
  };

  // SGE connection status
  const isSGEConnected = !!(eAlunoConfig?.credentials?.user && eAlunoConfig?.credentials?.password);

  // Tela de selecao de tipo de relatorio
  if (!tipoRelatorio) {
    const sgeCards = TIPOS_RELATORIO.filter(t => t.grupo === 'sge');
    const sgeDiretoCards = TIPOS_RELATORIO.filter(t => t.grupo === 'sge_direto');
    const luminarCards = TIPOS_RELATORIO.filter(t => t.grupo === 'luminar');

    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Relatorios de Chamada
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Selecione o tipo de relatorio que deseja gerar
        </Typography>

        {/* SGE Connection Status Banner */}
        {isSGEConnected ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              px: 2,
              py: 1,
              borderRadius: 1,
              bgcolor: 'success.50',
              border: '1px solid',
              borderColor: 'success.200',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
            <Typography variant="body2" fontWeight={500} color="success.main">
              SGE Conectado
            </Typography>
          </Box>
        ) : (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={onConfigureSGE}>
                Conectar ao SGE
              </Button>
            }
          >
            Conecte-se ao SGE (e-aluno) para acessar os relatorios de integracao.
          </Alert>
        )}

        {/* SGE Reports */}
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Relatorios SGE (e-aluno)
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {sgeCards.map((tipo) => {
            const CardIcon = isSGEConnected ? tipo.icon : LockIcon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tipo.id}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    ...(!isSGEConnected
                      ? { opacity: 0.5 }
                      : {
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                          },
                        }),
                  }}
                >
                  <CardActionArea
                    onClick={() => isSGEConnected ? handleSelectTipo(tipo.id) : onConfigureSGE()}
                    sx={{ height: '100%', p: 2 }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          bgcolor: isSGEConnected ? `${tipo.color}.100` : 'action.disabledBackground',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <CardIcon sx={{ fontSize: 32, color: isSGEConnected ? `${tipo.color}.main` : 'action.disabled' }} />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {tipo.titulo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tipo.descricao}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* SGE Direct Reports (HTML from e-aluno) */}
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Relatorios SGE (direto do e-aluno)
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {sgeDiretoCards.map((tipo) => {
            const CardIcon = isSGEConnected ? tipo.icon : LockIcon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tipo.id}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    ...(!isSGEConnected
                      ? { opacity: 0.5 }
                      : {
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                          },
                        }),
                  }}
                >
                  <CardActionArea
                    onClick={() => isSGEConnected ? handleSelectTipo(tipo.id) : onConfigureSGE()}
                    sx={{ height: '100%', p: 2 }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          bgcolor: isSGEConnected ? `${tipo.color}.100` : 'action.disabledBackground',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <CardIcon sx={{ fontSize: 32, color: isSGEConnected ? `${tipo.color}.main` : 'action.disabled' }} />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {tipo.titulo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tipo.descricao}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Luminar Reports */}
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Relatorios Luminar
        </Typography>
        <Grid container spacing={2}>
          {luminarCards.map((tipo) => {
            const Icon = tipo.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tipo.id}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleSelectTipo(tipo.id)}
                    sx={{ height: '100%', p: 2 }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          bgcolor: `${tipo.color}.100`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <Icon sx={{ fontSize: 32, color: `${tipo.color}.main` }} />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {tipo.titulo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tipo.descricao}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  }

  // Configuracao do relatorio selecionado
  const tipoConfig = TIPOS_RELATORIO.find(t => t.id === tipoRelatorio);
  const Icon = tipoConfig?.icon || TodayIcon;

  // Disabled state for Gerar button
  const isGenerateDisabled =
    loading ||
    (needsTurmaOnly && !turmaId) ||
    (needsTurmaDisciplina && (!turmaId || !disciplinaId));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={handleVoltar} size="small">
          Voltar
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon color={tipoConfig?.color as any} />
          <Typography variant="h5" fontWeight={600}>
            {tipoConfig?.titulo}
          </Typography>
        </Box>
      </Box>

      {/* Filtros (hidden for sync_all which is fully self-managed) */}
      {tipoRelatorio !== 'sync_all' && tipoRelatorio !== 'delete_all' && !isSgeProxy && <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Filtros
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Data (for dia, consultar_dia) */}
          {needsSingleDate && (
            <TextField
              label="Data"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: { xs: '100%', sm: 150 } }}
            />
          )}

          {/* Data range (for periodo, faltas, turma, consolidado) */}
          {needsDataRange && (
            <>
              <TextField
                label="Data Inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: { xs: '100%', sm: 150 } }}
              />
              <TextField
                label="Data Fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: { xs: '100%', sm: 150 } }}
              />
            </>
          )}

          {/* Turma (for turma, consultar_dia, mensal) */}
          {(needsTurmaDisciplina || needsTurmaOnly) && (
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel>Turma</InputLabel>
              <Select
                value={turmaId}
                label="Turma"
                onChange={(e) => setTurmaId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Selecione uma turma</em>
                </MenuItem>
                {turmas.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Disciplina (for consultar_dia, mensal) */}
          {needsTurmaDisciplina && (
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel>Disciplina</InputLabel>
              <Select
                value={disciplinaId}
                label="Disciplina"
                onChange={(e) => setDisciplinaId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Selecione uma disciplina</em>
                </MenuItem>
                {disciplinas.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Mes (for mensal) */}
          {needsMonth && (
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
              <InputLabel>Mes</InputLabel>
              <Select
                value={mesSelecionado}
                label="Mes"
                onChange={(e) => setMesSelecionado(e.target.value as number)}
              >
                {MESES_OPTIONS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>
                    {m.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Generate button (only for non-self-managed) */}
          {!isSelfManaged && (
            <Button
              variant="contained"
              onClick={loadRelatorio}
              disabled={isGenerateDisabled}
              size="small"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              {loading ? <CircularProgress size={20} /> : 'Gerar Relatorio'}
            </Button>
          )}
        </Box>
      </Paper>}

      {/* Conteudo do Relatorio */}
      {/* Self-managed reports render directly */}
      {tipoRelatorio === 'consultar_dia' && turmaId && disciplinaId && (
        <RelatorioConsultaDia
          turmaId={turmaId}
          disciplinaId={disciplinaId}
          data={dataInicio}
          turmas={turmas}
          disciplinas={disciplinas}
          professor={professor}
        />
      )}

      {tipoRelatorio === 'mensal' && turmaId && disciplinaId && (
        <RelatorioMensal
          turmaId={turmaId}
          disciplinaId={disciplinaId}
          mes={mesSelecionado}
          ano={new Date().getFullYear()}
          turmas={turmas}
          disciplinas={disciplinas}
          professor={professor}
        />
      )}

      {tipoRelatorio === 'sync_all' && (
        <RelatorioSyncAll
          turmas={turmas}
          disciplinas={disciplinas}
          professor={professor}
        />
      )}

      {tipoRelatorio === 'delete_all' && (
        <RelatorioDeleteAll
          turmas={turmas}
          disciplinas={disciplinas}
          professor={professor}
        />
      )}

      {tipoRelatorio === 'sge_chamadas_dia' && (
        <RelatorioSgeProxy
          tipo="chamadas_dia"
          turmas={turmas}
          disciplinas={disciplinas}
          professor={professor}
        />
      )}

      {tipoRelatorio === 'sge_detalhamento' && (
        <RelatorioSgeProxy
          tipo="detalhamento"
          turmas={turmas}
          disciplinas={disciplinas}
          professor={professor}
        />
      )}

      {tipoRelatorio === 'sge_mensal' && (
        <RelatorioSgeProxy
          tipo="mensal"
          turmas={turmas}
          disciplinas={disciplinas}
          professor={professor}
        />
      )}

      {/* Self-managed: show hint if filters incomplete */}
      {isSelfManaged && !isSgeProxy && tipoRelatorio !== 'sync_all' && tipoRelatorio !== 'delete_all' && (!turmaId || !disciplinaId) && (
        <Alert severity="info">
          Selecione uma turma e disciplina para gerar o relatorio.
        </Alert>
      )}

      {/* Non-self-managed reports */}
      {!isSelfManaged && (
        <>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
              <CircularProgress />
            </Box>
          ) : chamadas.length === 0 ? (
            <Alert severity="info">
              Nenhuma chamada encontrada para os filtros selecionados.
            </Alert>
          ) : (
            <>
              {tipoRelatorio === 'dia' && (
                <RelatorioDia
                  chamadas={chamadas}
                  turmas={turmas}
                  disciplinas={disciplinas}
                  professor={professor}
                  data={dataInicio}
                />
              )}

              {tipoRelatorio === 'periodo' && (
                <RelatorioPeriodo
                  chamadas={chamadas}
                  turmas={turmas}
                  disciplinas={disciplinas}
                  professor={professor}
                  dataInicio={dataInicio}
                  dataFim={dataFim}
                />
              )}

              {tipoRelatorio === 'faltas' && (
                <RelatorioFaltas
                  chamadas={chamadas}
                  turmas={turmas}
                  disciplinas={disciplinas}
                  professor={professor}
                  dataInicio={dataInicio}
                  dataFim={dataFim}
                />
              )}

              {tipoRelatorio === 'turma' && (
                <RelatorioTurma
                  chamadas={chamadas}
                  turma={turmas.find(t => t.id === turmaId) || null}
                  disciplinas={disciplinas}
                  professor={professor}
                  dataInicio={dataInicio}
                  dataFim={dataFim}
                />
              )}

              {tipoRelatorio === 'consolidado' && (
                <RelatorioConsolidado
                  chamadas={chamadas}
                  turmas={turmas}
                  disciplinas={disciplinas}
                  professor={professor}
                  dataInicio={dataInicio}
                  dataFim={dataFim}
                />
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}
