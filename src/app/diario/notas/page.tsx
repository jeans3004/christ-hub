'use client';

import { useEffect, useCallback, useState } from 'react';
import { Box, Paper, Tabs, Tab } from '@mui/material';
import { Star, Grading, ListAlt } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useFilterStore } from '@/store/filterStore';
import { useAuth } from '@/hooks/useAuth';
import { useTurmas, useDisciplinas, useAlunosByTurma, useRubricas, useAvaliacoesRubricas } from '@/hooks/useFirestoreData';

// Local imports
import { ModoEntrada } from './types';
import { useNotasData, useNotasTemplates, useNotasComposition, useNotasSave } from './hooks';
import {
  NotasFilters,
  NotasTable,
  TemplateModal,
  ComposicaoModal,
  AvaliacaoRubricasTab,
  RubricasTab,
  TabPanel,
  NotasEmptyState,
} from './components';

export default function NotasPage() {
  const { ano, setAno, serieId, setSerieId, disciplinaId, setDisciplinaId, bimestre, setBimestre } = useFilterStore();
  const { usuario } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // Firebase data hooks
  const { turmas, loading: loadingTurmas } = useTurmas(ano);
  const { disciplinas: todasDisciplinas, loading: loadingDisciplinas } = useDisciplinas();
  const { alunos, loading: loadingAlunos } = useAlunosByTurma(serieId || null);
  const { rubricas, loading: loadingRubricas, refetch: refetchRubricas } = useRubricas();
  const { avaliacoes, loading: loadingAvaliacoes, refetch: refetchAvaliacoes } = useAvaliacoesRubricas(serieId || null, bimestre, ano);

  // Filter disciplinas by selected turma
  const disciplinas = serieId
    ? todasDisciplinas.filter((d) => d.turmaIds?.includes(serieId))
    : [];

  // Clear disciplinaId when turma changes and current disciplina is not linked
  useEffect(() => {
    if (serieId && disciplinaId) {
      const disciplinaValida = todasDisciplinas.find(
        (d) => d.id === disciplinaId && d.turmaIds?.includes(serieId)
      );
      if (!disciplinaValida) setDisciplinaId('');
    }
  }, [serieId, todasDisciplinas, disciplinaId, setDisciplinaId]);

  // Notas data hook
  const {
    notas,
    setNotas,
    modosCells,
    setModosCells,
    loading: loadingNotas,
    getModoCell,
    handleNotaChange,
    calcularMedia,
  } = useNotasData({ serieId, disciplinaId, bimestre, ano, alunos });

  // Templates hook
  const {
    templateModalOpen,
    editingTemplateAv,
    templateSubNotas,
    novaSubNota,
    setNovaSubNota,
    handleOpenTemplateModal,
    handleCloseTemplateModal,
    handleSaveTemplate,
    handleAddTemplateSubNota,
    handleRemoveTemplateSubNota,
    handleTemplateSubNotaPorcentagemChange,
    handleTemplateSubNotaRubricasChange,
    getTemplate,
  } = useNotasTemplates({ turmaId: serieId, disciplinaId, bimestre, ano });

  // Composition hook
  const {
    notasModalOpen,
    subNotas,
    savingComposicao,
    openCompositionModal,
    closeCompositionModal,
    handleSubNotaValorChange,
    getTotalValoresMax,
    calcularNotaComposicao,
    gerarFormulaDetalhada,
    handleSaveNotasComposicao,
  } = useNotasComposition({
    serieId, disciplinaId, bimestre, ano, notas, setNotas,
    modosCells, setModosCells, getTemplate, avaliacoes, rubricas,
  });

  // Save hook
  const { saving, handleSaveNotas } = useNotasSave({
    serieId, disciplinaId, bimestre, ano, alunos, notas,
    getModoCell, usuarioId: usuario?.id,
  });

  // Handle mode selection from menu
  const handleSelectModo = useCallback(
    (modo: ModoEntrada, cellKey: string) => {
      if (modo === 'composicao') {
        openCompositionModal(cellKey);
      } else {
        setModosCells((prev) => ({ ...prev, [cellKey]: { modo } }));
      }
    },
    [openCompositionModal, setModosCells]
  );

  const isLoading = loadingTurmas || loadingDisciplinas || loadingAlunos || loadingNotas || loadingAvaliacoes;

  return (
    <MainLayout title="Notas" showSidebar>
      {/* Tabs Menu */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<Star />} iconPosition="start" label="Nota" />
          <Tab icon={<Grading />} iconPosition="start" label="Avaliacao por Rubricas" />
          <Tab icon={<ListAlt />} iconPosition="start" label="Rubricas" />
        </Tabs>
      </Paper>

      {/* Tab: Nota */}
      <TabPanel value={tabValue} index={0}>
        <Box>
          <NotasFilters
            ano={ano} setAno={setAno} serieId={serieId} setSerieId={setSerieId}
            disciplinaId={disciplinaId} setDisciplinaId={setDisciplinaId}
            bimestre={bimestre} setBimestre={setBimestre}
            turmas={turmas} disciplinas={disciplinas}
            loadingTurmas={loadingTurmas} loadingDisciplinas={loadingDisciplinas}
          />
          <Box>
            <NotasEmptyState
              showEmpty={!serieId || !disciplinaId}
              isLoading={isLoading}
              noAlunos={alunos.length === 0}
            />
            {serieId && disciplinaId && !isLoading && alunos.length > 0 && (
              <NotasTable
                alunos={alunos} notas={notas} modosCells={modosCells} saving={saving}
                getModoCell={getModoCell} handleNotaChange={handleNotaChange}
                calcularMedia={calcularMedia} handleSaveNotas={handleSaveNotas}
                handleOpenTemplateModal={handleOpenTemplateModal}
                handleSelectModo={handleSelectModo} openCompositionModal={openCompositionModal}
              />
            )}
          </Box>
        </Box>
      </TabPanel>

      {/* Tab: Avaliacao por Rubricas */}
      <TabPanel value={tabValue} index={1}>
        <AvaliacaoRubricasTab
          ano={ano} turmaId={serieId} disciplinaId={disciplinaId} bimestre={bimestre}
          turmas={turmas} disciplinas={todasDisciplinas}
          loadingTurmas={loadingTurmas} loadingDisciplinas={loadingDisciplinas}
          onAnoChange={setAno} onTurmaChange={setSerieId}
          onDisciplinaChange={setDisciplinaId} onBimestreChange={setBimestre}
          alunos={alunos} rubricas={rubricas} loadingAlunos={loadingAlunos || loadingRubricas}
          onSaveSuccess={refetchAvaliacoes}
        />
      </TabPanel>

      {/* Tab: Rubricas */}
      <TabPanel value={tabValue} index={2}>
        <RubricasTab rubricas={rubricas} loading={loadingRubricas} onRefresh={refetchRubricas} />
      </TabPanel>

      {/* Template Modal */}
      <TemplateModal
        open={templateModalOpen} editingAv={editingTemplateAv}
        templateSubNotas={templateSubNotas} novaSubNota={novaSubNota}
        setNovaSubNota={setNovaSubNota} onClose={handleCloseTemplateModal}
        onSave={handleSaveTemplate} onAddSubNota={handleAddTemplateSubNota}
        onRemoveSubNota={handleRemoveTemplateSubNota}
        onPorcentagemChange={handleTemplateSubNotaPorcentagemChange}
        onRubricasChange={handleTemplateSubNotaRubricasChange}
      />

      {/* Composicao Modal */}
      <ComposicaoModal
        open={notasModalOpen} subNotas={subNotas} saving={savingComposicao}
        onClose={closeCompositionModal} onSave={handleSaveNotasComposicao}
        onValorChange={handleSubNotaValorChange} getTotalValoresMax={getTotalValoresMax}
        calcularNotaComposicao={calcularNotaComposicao} gerarFormulaDetalhada={gerarFormulaDetalhada}
      />
    </MainLayout>
  );
}
