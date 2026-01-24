/**
 * Aba de avaliacao de alunos por rubrica para calculo de notas.
 * Organizada por componentes da composição da AV selecionada.
 */

import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Save, Grading, ExpandMore, CheckCircle } from '@mui/icons-material';
import {
  AvaliacaoFilters,
  AvaliacaoGrid,
  RubricaSelector,
  useAvaliacaoRubricas,
} from './rubrica';
import type { AvaliacaoRubricasTabProps } from './rubrica/types';

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
  onSaveSuccess,
}: AvaliacaoRubricasTabProps) {
  const {
    av, setAv,
    template, loadingTemplate,
    rubricasSelecionadas,
    expandedComponent, setExpandedComponent,
    loadingAvaliacoes,
    pendingChanges,
    saving,
    disciplinasFiltradas,
    hasPendingChanges,
    handleRubricaToggle,
    getAvaliacao,
    handleNivelClick,
    handleSaveAll,
    getRubricasDoComponente,
  } = useAvaliacaoRubricas({
    turmaId,
    disciplinaId,
    bimestre,
    ano,
    disciplinas,
    rubricas,
    onSaveSuccess,
  });

  const isLoading = loadingAlunos || loadingAvaliacoes || loadingTemplate;

  return (
    <Box>
      <AvaliacaoFilters
        ano={ano}
        turmaId={turmaId}
        disciplinaId={disciplinaId}
        bimestre={bimestre}
        av={av}
        turmas={turmas}
        disciplinas={disciplinas}
        disciplinasFiltradas={disciplinasFiltradas}
        loadingTurmas={loadingTurmas}
        loadingDisciplinas={loadingDisciplinas}
        onAnoChange={onAnoChange}
        onTurmaChange={onTurmaChange}
        onDisciplinaChange={onDisciplinaChange}
        onBimestreChange={onBimestreChange}
        onAvChange={setAv}
      />

      {!turmaId || !disciplinaId ? (
        <EmptyState />
      ) : isLoading ? (
        <LoadingState />
      ) : template.length === 0 ? (
        <Alert severity="warning">
          Nenhuma composição configurada para {av.toUpperCase()}. Configure a composição na aba "Nota" clicando na caneta ao lado de {av.toUpperCase()}.
        </Alert>
      ) : rubricas.length === 0 ? (
        <Alert severity="warning">
          Nenhuma rubrica cadastrada. Vá para Conceitos → Rubricas para criar critérios de avaliação.
        </Alert>
      ) : alunos.length === 0 ? (
        <Alert severity="info">Nenhum aluno encontrado nesta turma.</Alert>
      ) : (
        <>
          {template.map((componente) => {
            const rubricasComponente = getRubricasDoComponente(componente.id);
            const qtdSelecionadas = rubricasComponente.length;
            const qtdNecessarias = componente.quantidadeRubricas || 1;
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
                    <Chip label={`Valor: ${componente.porcentagem}`} size="small" color="primary" variant="outlined" />
                    <Chip
                      label={`${qtdSelecionadas}/${qtdNecessarias} rubricas`}
                      size="small"
                      color={selecaoCompleta ? 'success' : 'warning'}
                      icon={selecaoCompleta ? <CheckCircle /> : undefined}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <RubricaSelector
                    componenteId={componente.id}
                    qtdNecessarias={qtdNecessarias}
                    rubricas={rubricas}
                    rubricasSelecionadas={rubricasSelecionadas[componente.id] || []}
                    onToggle={handleRubricaToggle}
                  />
                  <AvaliacaoGrid
                    alunos={alunos}
                    rubricasComponente={rubricasComponente}
                    componenteId={componente.id}
                    getAvaliacao={getAvaliacao}
                    onNivelClick={handleNivelClick}
                  />
                </AccordionDetails>
              </Accordion>
            );
          })}

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

function EmptyState() {
  return (
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
  );
}

function LoadingState() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );
}
