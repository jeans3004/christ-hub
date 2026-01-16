/**
 * Aba de avaliacao de alunos por rubrica para calculo de notas.
 * Organizada por componentes da composição da AV selecionada.
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Save, Grading, ExpandMore, CheckCircle } from '@mui/icons-material';
import { Aluno, Rubrica, NivelRubrica, Turma, Disciplina, NotaComposicao } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { templateComposicaoService, avaliacaoRubricaService } from '@/services/firestore';

// Cores para cada nivel de rubrica
const NIVEL_COLORS: Record<NivelRubrica, { bg: string; text: string; border: string }> = {
  A: { bg: 'rgba(76, 175, 80, 0.15)', text: '#2E7D32', border: '#4CAF50' },
  B: { bg: 'rgba(33, 150, 243, 0.15)', text: '#1565C0', border: '#2196F3' },
  C: { bg: 'rgba(255, 193, 7, 0.15)', text: '#F57F17', border: '#FFC107' },
  D: { bg: 'rgba(255, 152, 0, 0.15)', text: '#E65100', border: '#FF9800' },
  E: { bg: 'rgba(244, 67, 54, 0.15)', text: '#C62828', border: '#F44336' },
};

// Niveis disponiveis
const NIVEIS: NivelRubrica[] = ['A', 'B', 'C', 'D', 'E'];

interface AvaliacaoRubricasTabProps {
  // Filtros
  ano: number;
  turmaId: string;
  disciplinaId: string;
  bimestre: number;
  turmas: Turma[];
  disciplinas: Disciplina[];
  loadingTurmas: boolean;
  loadingDisciplinas: boolean;
  onAnoChange: (ano: number) => void;
  onTurmaChange: (turmaId: string) => void;
  onDisciplinaChange: (disciplinaId: string) => void;
  onBimestreChange: (bimestre: number) => void;
  // Dados
  alunos: Aluno[];
  rubricas: Rubrica[];
  loadingAlunos: boolean;
}

// Tipo para rubricas selecionadas por componente
type RubricasSelecionadas = Record<string, string[]>; // componenteId -> rubricaIds[]

// Tipo para avaliações internas
interface AvaliacaoInterna {
  id: string;
  alunoId: string;
  rubricaId: string;
  componenteId: string;
  nivel: NivelRubrica;
}

export function AvaliacaoRubricasTab({
  ano,
  turmaId,
  disciplinaId,
  bimestre,
  turmas,
  disciplinas,
  loadingTurmas,
  loadingDisciplinas,
  onAnoChange,
  onTurmaChange,
  onDisciplinaChange,
  onBimestreChange,
  alunos,
  rubricas,
  loadingAlunos,
}: AvaliacaoRubricasTabProps) {
  const { usuario } = useAuth();
  const { addToast } = useUIStore();
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, NivelRubrica>>({});

  // Filtro de AV
  const [av, setAv] = useState<'av1' | 'av2'>('av1');

  // Template da composição
  const [template, setTemplate] = useState<NotaComposicao[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Rubricas selecionadas por componente
  const [rubricasSelecionadas, setRubricasSelecionadas] = useState<RubricasSelecionadas>({});

  // Componente expandido
  const [expandedComponent, setExpandedComponent] = useState<string | false>(false);

  // Avaliações carregadas do Firestore
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoInterna[]>([]);
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(false);

  // Filtrar disciplinas pela turma selecionada
  const disciplinasFiltradas = turmaId
    ? disciplinas.filter((d) => d.turmaIds?.includes(turmaId))
    : [];

  // Carregar avaliações quando mudar turma/bimestre/ano/av
  useEffect(() => {
    async function loadAvaliacoes() {
      if (!turmaId) {
        setAvaliacoes([]);
        return;
      }

      setLoadingAvaliacoes(true);
      try {
        const data = await avaliacaoRubricaService.getByTurmaBimestreAv(turmaId, bimestre, ano, av);
        setAvaliacoes(data.map(a => ({
          id: a.id,
          alunoId: a.alunoId,
          rubricaId: a.rubricaId,
          componenteId: a.componenteId || '', // Compatibilidade com dados antigos
          nivel: a.nivel,
        })));
      } catch (err) {
        console.error('Error loading avaliacoes:', err);
        setAvaliacoes([]);
      } finally {
        setLoadingAvaliacoes(false);
      }
    }

    loadAvaliacoes();
  }, [turmaId, bimestre, ano, av]);

  // Carregar template quando mudar turma/disciplina/bimestre/av
  useEffect(() => {
    async function loadTemplate() {
      if (!turmaId || !disciplinaId) {
        setTemplate([]);
        setRubricasSelecionadas({});
        return;
      }

      setLoadingTemplate(true);
      try {
        const templateData = await templateComposicaoService.getByTurmaDisciplinaBimestreAv(
          turmaId,
          disciplinaId,
          bimestre,
          av,
          ano
        );

        if (templateData?.componentes) {
          setTemplate(templateData.componentes);
          // Carregar rubricaIds salvas no template
          const rubricasCarregadas: RubricasSelecionadas = {};
          templateData.componentes.forEach((comp) => {
            if (comp.rubricaIds && comp.rubricaIds.length > 0) {
              rubricasCarregadas[comp.id] = comp.rubricaIds;
            }
          });
          setRubricasSelecionadas(rubricasCarregadas);
          // Expandir primeiro componente
          if (templateData.componentes.length > 0) {
            setExpandedComponent(templateData.componentes[0].id);
          }
        } else {
          setTemplate([]);
          setRubricasSelecionadas({});
        }
      } catch (error) {
        console.error('Error loading template:', error);
        setTemplate([]);
        setRubricasSelecionadas({});
      } finally {
        setLoadingTemplate(false);
      }
    }

    loadTemplate();
  }, [turmaId, disciplinaId, bimestre, av, ano]);

  // Handler para selecionar/deselecionar rubrica para um componente
  const handleRubricaToggle = (componenteId: string, rubricaId: string, maxRubricas: number) => {
    // Usar setState funcional para garantir que temos o estado mais recente
    setRubricasSelecionadas(prevRubricas => {
      const current = prevRubricas[componenteId] || [];
      const isSelected = current.includes(rubricaId);
      let newRubricaIds: string[];

      if (isSelected) {
        // Remover
        newRubricaIds = current.filter(id => id !== rubricaId);
      } else {
        // Adicionar (respeitando o limite)
        if (current.length >= maxRubricas) {
          addToast(`Máximo de ${maxRubricas} rubrica(s) para este componente`, 'warning');
          return prevRubricas; // Retorna estado inalterado
        }
        newRubricaIds = [...current, rubricaId];
      }

      // Atualizar template também usando setState funcional
      setTemplate(prevTemplate => {
        const updatedTemplate = prevTemplate.map(comp =>
          comp.id === componenteId
            ? { ...comp, rubricaIds: newRubricaIds }
            : comp
        );

        // Persistir no Firestore (fire and forget, mas com tratamento de erro)
        templateComposicaoService.save(
          turmaId,
          disciplinaId,
          bimestre,
          av,
          ano,
          updatedTemplate
        ).catch(error => {
          console.error('Error saving rubricaIds:', error);
          addToast('Erro ao salvar seleção de rubricas', 'error');
        });

        return updatedTemplate;
      });

      return {
        ...prevRubricas,
        [componenteId]: newRubricaIds,
      };
    });
  };

  const getAvaliacao = (alunoId: string, rubricaId: string, componenteId: string): NivelRubrica | null => {
    const key = `${alunoId}-${rubricaId}-${componenteId}`;
    if (pendingChanges[key]) return pendingChanges[key];

    const avaliacao = avaliacoes.find(
      (a) => a.alunoId === alunoId && a.rubricaId === rubricaId && a.componenteId === componenteId
    );
    return avaliacao?.nivel || null;
  };

  const handleNivelClick = (alunoId: string, rubricaId: string, componenteId: string, nivel: NivelRubrica) => {
    const key = `${alunoId}-${rubricaId}-${componenteId}`;
    const current = getAvaliacao(alunoId, rubricaId, componenteId);

    if (current === nivel) {
      setPendingChanges((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    } else {
      setPendingChanges((prev) => ({ ...prev, [key]: nivel }));
    }
  };

  const handleSaveAll = async () => {
    if (!usuario || !disciplinaId || !turmaId) {
      addToast('Selecione uma disciplina', 'error');
      return;
    }

    if (Object.keys(pendingChanges).length === 0) {
      addToast('Nenhuma alteração para salvar', 'info');
      return;
    }

    setSaving(true);
    try {
      const entries = Object.entries(pendingChanges);
      for (const [key, nivel] of entries) {
        const [alunoId, rubricaId, componenteId] = key.split('-');

        // Check if avaliacao already exists
        const existing = avaliacoes.find(
          a => a.alunoId === alunoId && a.rubricaId === rubricaId && a.componenteId === componenteId
        );

        if (existing) {
          await avaliacaoRubricaService.update(existing.id, { nivel });
        } else {
          await avaliacaoRubricaService.create({
            alunoId,
            turmaId,
            disciplinaId,
            rubricaId,
            componenteId,
            av,
            professorId: usuario.id,
            bimestre,
            ano,
            nivel,
          });
        }
      }

      // Recarregar avaliações
      const data = await avaliacaoRubricaService.getByTurmaBimestreAv(turmaId, bimestre, ano, av);
      setAvaliacoes(data.map(a => ({
        id: a.id,
        alunoId: a.alunoId,
        rubricaId: a.rubricaId,
        componenteId: a.componenteId || '',
        nivel: a.nivel,
      })));

      setPendingChanges({});
      addToast('Avaliações salvas com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving avaliacoes:', error);
      addToast('Erro ao salvar avaliações', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  // Obter rubricas selecionadas para um componente
  const getRubricasDoComponente = (componenteId: string): Rubrica[] => {
    const ids = rubricasSelecionadas[componenteId] || [];
    return rubricas.filter(r => ids.includes(r.id));
  };

  return (
    <Box>
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Ano</InputLabel>
            <Select value={ano} label="Ano" onChange={(e) => onAnoChange(Number(e.target.value))}>
              <MenuItem value={2026}>2026</MenuItem>
              <MenuItem value={2025}>2025</MenuItem>
              <MenuItem value={2024}>2024</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Turma</InputLabel>
            <Select
              value={turmaId}
              label="Turma"
              onChange={(e) => onTurmaChange(e.target.value)}
              disabled={loadingTurmas}
            >
              <MenuItem value="">Selecione...</MenuItem>
              {turmas.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Disciplina</InputLabel>
            <Select
              value={disciplinaId}
              label="Disciplina"
              onChange={(e) => onDisciplinaChange(e.target.value)}
              disabled={loadingDisciplinas || !turmaId}
            >
              <MenuItem value="">
                {!turmaId ? 'Selecione uma turma' : 'Selecione...'}
              </MenuItem>
              {disciplinasFiltradas.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Bimestre</InputLabel>
            <Select
              value={bimestre}
              label="Bimestre"
              onChange={(e) => onBimestreChange(Number(e.target.value))}
            >
              <MenuItem value={1}>1º Bimestre</MenuItem>
              <MenuItem value={2}>2º Bimestre</MenuItem>
              <MenuItem value={3}>3º Bimestre</MenuItem>
              <MenuItem value={4}>4º Bimestre</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>AV</InputLabel>
            <Select
              value={av}
              label="AV"
              onChange={(e) => setAv(e.target.value as 'av1' | 'av2')}
            >
              <MenuItem value="av1">AV1</MenuItem>
              <MenuItem value="av2">AV2</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Conteúdo */}
      {!turmaId || !disciplinaId ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Grading sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
          <Typography variant="body1" color="primary.main">
            Selecione a turma e disciplina para avaliar os alunos por rubricas
          </Typography>
        </Paper>
      ) : loadingAlunos || loadingAvaliacoes || loadingTemplate ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : template.length === 0 ? (
        <Alert severity="warning">
          Nenhuma composição configurada para {av.toUpperCase()}. Configure a composição na aba "Nota" clicando na caneta ao lado de {av.toUpperCase()}.
        </Alert>
      ) : rubricas.length === 0 ? (
        <Alert severity="warning">
          Nenhuma rubrica cadastrada. Vá para Conceitos → Rubricas para criar critérios de avaliação.
        </Alert>
      ) : alunos.length === 0 ? (
        <Alert severity="info">
          Nenhum aluno encontrado nesta turma.
        </Alert>
      ) : (
        <>
          {/* Componentes da Composição */}
          {template.map((componente) => {
            const rubricasComponente = getRubricasDoComponente(componente.id);
            const qtdSelecionadas = rubricasComponente.length;
            const qtdNecessarias = componente.quantidadeRubricas;
            const selecaoCompleta = qtdSelecionadas === qtdNecessarias;

            return (
              <Accordion
                key={componente.id}
                expanded={expandedComponent === componente.id}
                onChange={(_, isExpanded) => setExpandedComponent(isExpanded ? componente.id : false)}
                sx={{ mb: 2 }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography fontWeight={600}>{componente.nome}</Typography>
                    <Chip
                      label={`Valor: ${componente.porcentagem}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`${qtdSelecionadas}/${qtdNecessarias} rubricas`}
                      size="small"
                      color={selecaoCompleta ? 'success' : 'warning'}
                      icon={selecaoCompleta ? <CheckCircle /> : undefined}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {/* Seleção de Rubricas */}
                  <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selecione {qtdNecessarias} rubrica(s) para avaliar este componente:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {rubricas.map((rubrica) => {
                        const isSelected = (rubricasSelecionadas[componente.id] || []).includes(rubrica.id);
                        return (
                          <FormControlLabel
                            key={rubrica.id}
                            control={
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleRubricaToggle(componente.id, rubrica.id, qtdNecessarias)}
                                size="small"
                              />
                            }
                            label={rubrica.nome}
                            sx={{
                              bgcolor: isSelected ? 'primary.light' : 'transparent',
                              borderRadius: 1,
                              px: 1,
                              mr: 1,
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Paper>

                  {/* Tabela de Avaliação para as rubricas selecionadas */}
                  {rubricasComponente.length > 0 ? (
                    <Paper sx={{ overflow: 'auto' }}>
                      <Box sx={{ minWidth: 400 }}>
                        {/* Header */}
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: `40px 200px repeat(${rubricasComponente.length}, 1fr)`,
                            gap: 1,
                            p: 2,
                            bgcolor: 'grey.100',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography fontWeight={600} textAlign="center">Nº</Typography>
                          <Typography fontWeight={600}>Aluno</Typography>
                          {rubricasComponente.map((rubrica) => (
                            <Tooltip key={rubrica.id} title={rubrica.descricao || ''}>
                              <Typography fontWeight={600} textAlign="center" noWrap>
                                {rubrica.nome}
                              </Typography>
                            </Tooltip>
                          ))}
                        </Box>

                        {/* Body */}
                        {alunos.map((aluno, index) => (
                          <Box
                            key={aluno.id}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: `40px 200px repeat(${rubricasComponente.length}, 1fr)`,
                              gap: 1,
                              p: 2,
                              borderBottom: index < alunos.length - 1 ? '1px solid' : 'none',
                              borderColor: 'divider',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <Typography fontWeight={500} textAlign="center" color="text.secondary">
                              {index + 1}
                            </Typography>
                            <Typography fontWeight={500} noWrap>
                              {aluno.nome}
                            </Typography>
                            {rubricasComponente.map((rubrica) => {
                              const currentNivel = getAvaliacao(aluno.id, rubrica.id, componente.id);

                              return (
                                <Box
                                  key={rubrica.id}
                                  sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}
                                >
                                  {NIVEIS.map((nivel) => {
                                    const isSelected = currentNivel === nivel;
                                    const colors = NIVEL_COLORS[nivel];
                                    const desc = rubrica.niveis.find((n) => n.nivel === nivel)?.descricao;

                                    return (
                                      <Tooltip key={nivel} title={desc || `Nível ${nivel}`}>
                                        <Box
                                          onClick={() => handleNivelClick(aluno.id, rubrica.id, componente.id, nivel)}
                                          sx={{
                                            width: 28,
                                            height: 28,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 0.5,
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            bgcolor: isSelected ? colors.bg : 'transparent',
                                            border: '2px solid',
                                            borderColor: isSelected ? colors.border : 'grey.300',
                                            color: isSelected ? colors.text : 'grey.500',
                                            transition: 'all 0.15s',
                                            '&:hover': {
                                              borderColor: colors.border,
                                              bgcolor: colors.bg,
                                              color: colors.text,
                                            },
                                          }}
                                        >
                                          {nivel}
                                        </Box>
                                      </Tooltip>
                                    );
                                  })}
                                </Box>
                              );
                            })}
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  ) : (
                    <Alert severity="info">
                      Selecione as rubricas acima para avaliar os alunos neste componente.
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}

          {/* Botão Salvar */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
              onClick={handleSaveAll}
              disabled={saving || !hasPendingChanges}
            >
              {saving ? 'Salvando...' : hasPendingChanges ? `Salvar (${Object.keys(pendingChanges).length} alterações)` : 'Salvar Avaliações'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
