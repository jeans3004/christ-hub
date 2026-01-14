/**
 * Aba de avaliacao de alunos por rubrica.
 */

import { useState } from 'react';
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
} from '@mui/material';
import { Save, Person } from '@mui/icons-material';
import { Aluno, Rubrica, AvaliacaoRubrica, NivelRubrica, Turma, Disciplina } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { NivelChip } from './NivelChip';
import { NIVEIS, NIVEL_COLORS } from '../types';

interface AvaliacaoTabProps {
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
  avaliacoes: AvaliacaoRubrica[];
  loading: boolean;
  // Acoes
  onSaveAvaliacao: (
    alunoId: string,
    rubricaId: string,
    disciplinaId: string,
    professorId: string,
    nivel: NivelRubrica
  ) => Promise<boolean>;
}

export function AvaliacaoTab({
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
  avaliacoes,
  loading,
  onSaveAvaliacao,
}: AvaliacaoTabProps) {
  const { usuario } = useAuth();
  const { addToast } = useUIStore();
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, NivelRubrica>>({});

  // Filtrar disciplinas pela turma selecionada
  const disciplinasFiltradas = turmaId
    ? disciplinas.filter((d) => d.turmaIds?.includes(turmaId))
    : [];

  const getAvaliacao = (alunoId: string, rubricaId: string): NivelRubrica | null => {
    // Primeiro verifica se há mudança pendente
    const key = `${alunoId}-${rubricaId}`;
    if (pendingChanges[key]) return pendingChanges[key];

    // Senão busca na lista de avaliacoes
    const avaliacao = avaliacoes.find(
      (a) => a.alunoId === alunoId && a.rubricaId === rubricaId
    );
    return avaliacao?.nivel || null;
  };

  const handleNivelClick = (alunoId: string, rubricaId: string, nivel: NivelRubrica) => {
    const key = `${alunoId}-${rubricaId}`;
    const current = getAvaliacao(alunoId, rubricaId);

    if (current === nivel) {
      // Remove se clicar no mesmo nivel
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
    if (!usuario || !disciplinaId) {
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
        const [alunoId, rubricaId] = key.split('-');
        await onSaveAvaliacao(alunoId, rubricaId, disciplinaId, usuario.id, nivel);
      }
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
        </Box>
      </Paper>

      {/* Conteúdo */}
      {!turmaId || !disciplinaId ? (
        <Box sx={{ p: 6, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2 }}>
          <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Selecione a turma e disciplina para avaliar os alunos
          </Typography>
        </Box>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : rubricas.length === 0 ? (
        <Alert severity="warning">
          Nenhuma rubrica cadastrada. Vá para a aba "Rubricas" para criar critérios de avaliação.
        </Alert>
      ) : alunos.length === 0 ? (
        <Alert severity="info">
          Nenhum aluno encontrado nesta turma.
        </Alert>
      ) : (
        <>
          {/* Tabela de Avaliação */}
          <Paper sx={{ overflow: 'auto' }}>
            <Box sx={{ minWidth: 600 }}>
              {/* Header */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `200px repeat(${rubricas.length}, 1fr)`,
                  gap: 1,
                  p: 2,
                  bgcolor: 'grey.100',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography fontWeight={600}>Aluno</Typography>
                {rubricas.map((rubrica) => (
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
                    gridTemplateColumns: `200px repeat(${rubricas.length}, 1fr)`,
                    gap: 1,
                    p: 2,
                    borderBottom: index < alunos.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Typography fontWeight={500} noWrap>
                    {aluno.nome}
                  </Typography>
                  {rubricas.map((rubrica) => {
                    const currentNivel = getAvaliacao(aluno.id, rubrica.id);
                    const nivelDescricao = rubrica.niveis.find((n) => n.nivel === currentNivel)?.descricao;

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
                                onClick={() => handleNivelClick(aluno.id, rubrica.id, nivel)}
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
