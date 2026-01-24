/**
 * Configuracao de Trilhas - Atribuicao de alunos as areas.
 * Usado por coordenadores e administradores.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  CheckBox as CheckAllIcon,
  CheckBoxOutlineBlank as UncheckAllIcon,
  Edit as ManualIcon,
  CloudUpload as ImportIcon,
} from '@mui/icons-material';
import { Aluno, Turma } from '@/types';
import { alunoService, turmaService } from '@/services/firestore';
import { AREAS_CONHECIMENTO, SERIES_ENSINO_MEDIO, AreaConhecimentoId } from '@/constants';
import { useUIStore } from '@/store/uiStore';
import { TrilhasImport } from './TrilhasImport';

interface TrilhasConfigProps {
  ano: number;
}

interface AlunoComTurma extends Aluno {
  turmaNome: string;
  serieNome: string;
}

export function TrilhasConfig({ ano }: TrilhasConfigProps) {
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alunos, setAlunos] = useState<AlunoComTurma[]>([]);
  const [turmasMap, setTurmasMap] = useState<Map<string, Turma>>(new Map());

  // Estado de selecao e atribuicao
  const [selectedAlunos, setSelectedAlunos] = useState<Set<string>>(new Set());
  const [areaAtribuicoes, setAreaAtribuicoes] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const turmas = await turmaService.getByAno(ano);
      const turmasEM = turmas.filter(t => t.ensino === 'Ensino Médio' && t.ativo);
      const tMap = new Map(turmasEM.map(t => [t.id, t]));
      setTurmasMap(tMap);

      const turmaIds = Array.from(tMap.keys());
      const alunosPromises = turmaIds.map(id => alunoService.getByTurma(id));
      const alunosArrays = await Promise.all(alunosPromises);
      const todosAlunos = alunosArrays.flat().map(a => ({
        ...a,
        turmaNome: tMap.get(a.turmaId)?.nome || '',
        serieNome: tMap.get(a.turmaId)?.serie || '',
      }));

      setAlunos(todosAlunos);

      // Inicializar atribuicoes existentes
      const atribuicoes: Record<string, string> = {};
      todosAlunos.forEach(a => {
        if (a.areaConhecimentoId) {
          atribuicoes[a.id] = a.areaConhecimentoId;
        }
      });
      setAreaAtribuicoes(atribuicoes);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      addToast('Erro ao carregar alunos', 'error');
    } finally {
      setLoading(false);
    }
  }, [ano, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Agrupar alunos por serie
  const alunosPorSerie = SERIES_ENSINO_MEDIO.reduce((acc, serie) => {
    const normalizar = (s: string) => s.toLowerCase().replace(/[ªºa]/g, '').replace(/\s+/g, ' ').trim();
    acc[serie] = alunos.filter(a => normalizar(a.serieNome) === normalizar(serie));
    return acc;
  }, {} as Record<string, AlunoComTurma[]>);

  // Toggle selecao de aluno
  const toggleAluno = (alunoId: string) => {
    setSelectedAlunos(prev => {
      const next = new Set(prev);
      if (next.has(alunoId)) {
        next.delete(alunoId);
      } else {
        next.add(alunoId);
      }
      return next;
    });
  };

  // Selecionar todos de uma serie
  const selecionarTodosSerie = (serie: string, selecionar: boolean) => {
    const alunosSerie = alunosPorSerie[serie] || [];
    setSelectedAlunos(prev => {
      const next = new Set(prev);
      alunosSerie.forEach(a => {
        if (selecionar) {
          next.add(a.id);
        } else {
          next.delete(a.id);
        }
      });
      return next;
    });
  };

  // Atribuir area aos selecionados
  const atribuirArea = (areaId: string) => {
    if (selectedAlunos.size === 0) {
      addToast('Selecione pelo menos um aluno', 'warning');
      return;
    }

    setAreaAtribuicoes(prev => {
      const next = { ...prev };
      selectedAlunos.forEach(alunoId => {
        if (areaId) {
          next[alunoId] = areaId;
        } else {
          delete next[alunoId];
        }
      });
      return next;
    });
    setHasChanges(true);
    setSelectedAlunos(new Set());

    const area = AREAS_CONHECIMENTO.find(a => a.id === areaId);
    addToast(`${selectedAlunos.size} aluno(s) atribuído(s) a ${area?.nome || 'Nenhuma área'}`, 'success');
  };

  // Salvar atribuicoes
  const salvar = async () => {
    setSaving(true);
    try {
      const updates = alunos.map(aluno => {
        const novaArea = areaAtribuicoes[aluno.id] || null;
        const areaAtual = aluno.areaConhecimentoId || null;

        if (novaArea !== areaAtual) {
          return alunoService.update(aluno.id, {
            areaConhecimentoId: novaArea || undefined
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updates);
      setHasChanges(false);
      addToast('Atribuições salvas com sucesso!', 'success');
      loadData(); // Recarregar para sincronizar
    } catch (error) {
      console.error('Erro ao salvar:', error);
      addToast('Erro ao salvar atribuições', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Contar alunos por area
  const contarPorArea = (areaId: string) => {
    return Object.values(areaAtribuicoes).filter(a => a === areaId).length;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
        >
          <Tab icon={<ManualIcon />} iconPosition="start" label="Atribuicao Manual" />
          <Tab icon={<ImportIcon />} iconPosition="start" label="Importar do Forms" />
        </Tabs>
      </Paper>

      {/* Tab: Importar */}
      {activeTab === 1 && (
        <TrilhasImport
          alunos={alunos}
          onImportComplete={loadData}
        />
      )}

      {/* Tab: Manual */}
      {activeTab === 0 && (
      <Box>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Atribuicao Manual de Areas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Selecione os alunos e atribua-os a uma area do conhecimento.
        </Typography>

        {/* Resumo por area */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {AREAS_CONHECIMENTO.map(area => (
            <Chip
              key={area.id}
              label={`${area.sigla}: ${contarPorArea(area.id)}`}
              size="small"
              sx={{ bgcolor: area.cor, color: 'white' }}
            />
          ))}
          <Chip
            label={`Sem área: ${alunos.length - Object.keys(areaAtribuicoes).length}`}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Acoes */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2">
            {selectedAlunos.size} aluno(s) selecionado(s)
          </Typography>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Atribuir à área</InputLabel>
            <Select
              label="Atribuir à área"
              value=""
              onChange={(e) => atribuirArea(e.target.value)}
              disabled={selectedAlunos.size === 0}
            >
              <MenuItem value="">
                <em>Remover área</em>
              </MenuItem>
              {AREAS_CONHECIMENTO.map(area => (
                <MenuItem key={area.id} value={area.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: area.cor }} />
                    {area.nome}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flex: 1 }} />

          {hasChanges && (
            <Chip label="Alterações não salvas" color="warning" size="small" />
          )}

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={salvar}
            disabled={saving || !hasChanges}
          >
            Salvar Atribuições
          </Button>
        </Box>
      </Paper>

      {/* Lista de alunos por serie */}
      {SERIES_ENSINO_MEDIO.map(serie => {
        const alunosSerie = alunosPorSerie[serie] || [];
        if (alunosSerie.length === 0) return null;

        const todosSelecionados = alunosSerie.every(a => selectedAlunos.has(a.id));

        return (
          <Accordion key={serie} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {serie}
                </Typography>
                <Chip label={`${alunosSerie.length} alunos`} size="small" />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Box sx={{ px: 2, pb: 1 }}>
                <Button
                  size="small"
                  startIcon={todosSelecionados ? <UncheckAllIcon /> : <CheckAllIcon />}
                  onClick={() => selecionarTodosSerie(serie, !todosSelecionados)}
                >
                  {todosSelecionados ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              </Box>
              <Divider />
              <List dense disablePadding>
                {alunosSerie.map(aluno => {
                  const area = AREAS_CONHECIMENTO.find(a => a.id === areaAtribuicoes[aluno.id]);
                  return (
                    <ListItem key={aluno.id} disablePadding>
                      <ListItemButton onClick={() => toggleAluno(aluno.id)} dense>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Checkbox
                            edge="start"
                            checked={selectedAlunos.has(aluno.id)}
                            tabIndex={-1}
                            disableRipple
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={aluno.nome}
                          secondary={aluno.turmaNome}
                        />
                        {area && (
                          <Chip
                            label={area.sigla}
                            size="small"
                            sx={{ bgcolor: area.cor, color: 'white', ml: 1 }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {alunos.length === 0 && (
        <Alert severity="info">
          Nenhum aluno do Ensino Médio encontrado para o ano {ano}.
        </Alert>
      )}
      </Box>
      )}
    </Box>
  );
}
