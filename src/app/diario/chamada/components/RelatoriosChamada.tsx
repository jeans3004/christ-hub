/**
 * Componente principal de Relatorios de Chamada.
 * Permite ao professor escolher entre diferentes tipos de relatorio.
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
  Chip,
} from '@mui/material';
import {
  Today as TodayIcon,
  DateRange as PeriodIcon,
  Warning as FaltasIcon,
  Class as TurmaIcon,
  Assessment as ConsolidadoIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario } from '@/types';
import { chamadaService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';

// Relatorio do Dia
import { RelatorioDia } from './relatorios/RelatorioDia';
import { RelatorioPeriodo } from './relatorios/RelatorioPeriodo';
import { RelatorioFaltas } from './relatorios/RelatorioFaltas';
import { RelatorioTurma } from './relatorios/RelatorioTurma';
import { RelatorioConsolidado } from './relatorios/RelatorioConsolidado';

type TipoRelatorio = 'dia' | 'periodo' | 'faltas' | 'turma' | 'consolidado' | null;

interface RelatoriosChamadaProps {
  professor: Usuario | null;
  turmas: Turma[];
  disciplinas: Disciplina[];
}

const TIPOS_RELATORIO = [
  {
    id: 'dia' as TipoRelatorio,
    titulo: 'Espelho do Dia',
    descricao: 'Todas as chamadas de um dia especifico',
    icon: TodayIcon,
    color: 'primary',
  },
  {
    id: 'periodo' as TipoRelatorio,
    titulo: 'Relatorio por Periodo',
    descricao: 'Chamadas de um periodo (semana, mes)',
    icon: PeriodIcon,
    color: 'info',
  },
  {
    id: 'faltas' as TipoRelatorio,
    titulo: 'Relatorio de Faltas',
    descricao: 'Alunos com mais faltas no periodo',
    icon: FaltasIcon,
    color: 'error',
  },
  {
    id: 'turma' as TipoRelatorio,
    titulo: 'Relatorio por Turma',
    descricao: 'Historico de uma turma especifica',
    icon: TurmaIcon,
    color: 'success',
  },
  {
    id: 'consolidado' as TipoRelatorio,
    titulo: 'Relatorio Consolidado',
    descricao: 'Resumo geral de todas as turmas',
    icon: ConsolidadoIcon,
    color: 'warning',
  },
];

export function RelatoriosChamada({
  professor,
  turmas,
  disciplinas,
}: RelatoriosChamadaProps) {
  const { addToast } = useUIStore();

  // Estado do tipo de relatorio selecionado
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>(null);

  // Filtros - usando funcao para garantir data valida
  const getToday = () => {
    try {
      return new Date().toISOString().split('T')[0];
    } catch {
      // Fallback se algo der errado
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

  // Dados carregados
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [loading, setLoading] = useState(false);

  // Validar se uma string de data e valida
  const isValidDate = (dateStr: string): boolean => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const date = new Date(dateStr + 'T12:00:00');
    return !isNaN(date.getTime());
  };

  // Carregar dados do relatorio
  const loadRelatorio = useCallback(async () => {
    if (!professor?.id || !tipoRelatorio) return;

    // Validar datas antes de prosseguir
    if (!isValidDate(dataInicio)) {
      addToast('Data invalida', 'error');
      return;
    }

    if (tipoRelatorio !== 'dia' && !isValidDate(dataFim)) {
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
            // Buscar todas as chamadas da turma no periodo
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
  }, [professor?.id, tipoRelatorio, dataInicio, dataFim, turmaId, addToast]);

  // Carregar ao mudar filtros
  useEffect(() => {
    if (tipoRelatorio) {
      loadRelatorio();
    }
  }, [tipoRelatorio, loadRelatorio]);

  // Voltar para selecao de tipo
  const handleVoltar = () => {
    setTipoRelatorio(null);
    setChamadas([]);
  };

  // Tela de selecao de tipo de relatorio
  if (!tipoRelatorio) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Relatorios de Chamada
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Selecione o tipo de relatorio que deseja gerar
        </Typography>

        <Grid container spacing={2}>
          {TIPOS_RELATORIO.map((tipo) => {
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
                    onClick={() => setTipoRelatorio(tipo.id)}
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

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Filtros
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Data Inicio */}
          <TextField
            label={tipoRelatorio === 'dia' ? 'Data' : 'Data Inicio'}
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          {/* Data Fim (apenas para periodo) */}
          {tipoRelatorio !== 'dia' && (
            <TextField
              label="Data Fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
          )}

          {/* Turma (apenas para relatorio por turma) */}
          {tipoRelatorio === 'turma' && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Turma</InputLabel>
              <Select
                value={turmaId}
                label="Turma"
                onChange={(e) => setTurmaId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Selecione uma turma</em>
                </MenuItem>
                {turmas.map((turma) => (
                  <MenuItem key={turma.id} value={turma.id}>
                    {turma.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            variant="contained"
            onClick={loadRelatorio}
            disabled={loading || (tipoRelatorio === 'turma' && !turmaId)}
            size="small"
          >
            {loading ? <CircularProgress size={20} /> : 'Gerar Relatorio'}
          </Button>
        </Box>
      </Paper>

      {/* Conteudo do Relatorio */}
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
    </Box>
  );
}
