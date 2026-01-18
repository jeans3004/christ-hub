/**
 * Aba de avaliacao de alunos por rubrica.
 */

import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { Save, Person } from '@mui/icons-material';
import { AvaliacaoTabProps } from './avaliacao-tab/types';
import { AvaliacaoFilters, AvaliacaoTable, useAvaliacaoTab } from './avaliacao-tab';

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
  const {
    saving,
    disciplinasFiltradas,
    hasPendingChanges,
    pendingCount,
    getAvaliacao,
    handleNivelClick,
    handleSaveAll,
  } = useAvaliacaoTab({
    turmaId,
    disciplinaId,
    disciplinas,
    avaliacoes,
    onSaveAvaliacao,
  });

  return (
    <Box>
      <AvaliacaoFilters
        ano={ano}
        turmaId={turmaId}
        disciplinaId={disciplinaId}
        bimestre={bimestre}
        turmas={turmas}
        disciplinasFiltradas={disciplinasFiltradas}
        loadingTurmas={loadingTurmas}
        loadingDisciplinas={loadingDisciplinas}
        onAnoChange={onAnoChange}
        onTurmaChange={onTurmaChange}
        onDisciplinaChange={onDisciplinaChange}
        onBimestreChange={onBimestreChange}
      />

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
        <Alert severity="info">Nenhum aluno encontrado nesta turma.</Alert>
      ) : (
        <>
          <AvaliacaoTable
            alunos={alunos}
            rubricas={rubricas}
            getAvaliacao={getAvaliacao}
            onNivelClick={handleNivelClick}
          />

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
              onClick={handleSaveAll}
              disabled={saving || !hasPendingChanges}
            >
              {saving ? 'Salvando...' : hasPendingChanges ? `Salvar (${pendingCount} alterações)` : 'Salvar Avaliações'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
