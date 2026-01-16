'use client';

import { useEffect, useCallback, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Tabs, Tab } from '@mui/material';
import { Star, Grading, ListAlt } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useFilterStore } from '@/store/filterStore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { useTurmas, useDisciplinas, useAlunosByTurma, useRubricas, useAvaliacoesRubricas } from '@/hooks/useFirestoreData';
import { notaService } from '@/services/firestore';

// Local imports
import { ModoEntrada, parseCellKey } from './types';
import { useNotasData, useNotasTemplates, useNotasComposition } from './hooks';
import { NotasFilters, NotasTable, TemplateModal, ComposicaoModal, AvaliacaoRubricasTab, RubricasTab } from './components';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function NotasPage() {
  const { ano, setAno, serieId, setSerieId, disciplinaId, setDisciplinaId, bimestre, setBimestre } = useFilterStore();
  const { addToast } = useUIStore();
  const { usuario } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Firebase data hooks
  const { turmas, loading: loadingTurmas } = useTurmas(ano);
  const { disciplinas: todasDisciplinas, loading: loadingDisciplinas } = useDisciplinas();
  const { alunos, loading: loadingAlunos } = useAlunosByTurma(serieId || null);
  const { rubricas, loading: loadingRubricas, refetch: refetchRubricas } = useRubricas();
  const { avaliacoes, loading: loadingAvaliacoes, saveAvaliacao } = useAvaliacoesRubricas(
    serieId || null,
    bimestre,
    ano
  );

  // Filter disciplinas by selected turma
  const disciplinas = serieId
    ? todasDisciplinas.filter(d => d.turmaIds?.includes(serieId))
    : [];

  // Clear disciplinaId when turma changes and current disciplina is not linked
  useEffect(() => {
    if (serieId && disciplinaId) {
      const disciplinaValida = todasDisciplinas.find(
        d => d.id === disciplinaId && d.turmaIds?.includes(serieId)
      );
      if (!disciplinaValida) {
        setDisciplinaId('');
      }
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
  } = useNotasData({
    serieId,
    disciplinaId,
    bimestre,
    ano,
    alunos,
  });

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
  } = useNotasTemplates({
    turmaId: serieId,
    disciplinaId,
    bimestre,
    ano,
  });

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
    serieId,
    disciplinaId,
    bimestre,
    ano,
    notas,
    setNotas,
    modosCells,
    setModosCells,
    getTemplate,
    avaliacoes,
    rubricas,
  });

  // Saving state for main save button
  const [saving, setSaving] = useState(false);

  // Handle mode selection from menu
  const handleSelectModo = useCallback((modo: ModoEntrada, cellKey: string) => {
    if (modo === 'composicao') {
      openCompositionModal(cellKey);
    } else {
      setModosCells(prev => ({
        ...prev,
        [cellKey]: { modo },
      }));
    }
  }, [openCompositionModal, setModosCells]);

  // Save all notas
  const handleSaveNotas = useCallback(async () => {
    if (!serieId || !disciplinaId || !usuario) {
      addToast('Selecione turma e disciplina', 'error');
      return;
    }

    setSaving(true);
    try {
      for (const aluno of alunos) {
        const alunoNotas = notas[aluno.id];
        if (!alunoNotas) continue;

        // Save AV1 if set and mode is not blocked
        const modoAv1 = getModoCell(aluno.id, 'av1');
        if (modoAv1.modo !== 'bloqueado' && alunoNotas.av1 !== null) {
          const notaData: Record<string, unknown> = {
            alunoId: aluno.id,
            turmaId: serieId,
            disciplinaId,
            professorId: usuario.id,
            bimestre: bimestre as 1 | 2 | 3 | 4,
            tipo: 'AV1',
            valor: alunoNotas.av1,
            ano,
          };

          if (modoAv1.composicao && modoAv1.composicao.length > 0) {
            notaData.composicao = modoAv1.composicao;
          }

          if (alunoNotas.av1Id) {
            await notaService.update(alunoNotas.av1Id, notaData);
          } else {
            await notaService.create(notaData as Parameters<typeof notaService.create>[0]);
          }
        }

        // Save AV2 if set and mode is not blocked
        const modoAv2 = getModoCell(aluno.id, 'av2');
        if (modoAv2.modo !== 'bloqueado' && alunoNotas.av2 !== null) {
          const notaData: Record<string, unknown> = {
            alunoId: aluno.id,
            turmaId: serieId,
            disciplinaId,
            professorId: usuario.id,
            bimestre: bimestre as 1 | 2 | 3 | 4,
            tipo: 'AV2',
            valor: alunoNotas.av2,
            ano,
          };

          if (modoAv2.composicao && modoAv2.composicao.length > 0) {
            notaData.composicao = modoAv2.composicao;
          }

          if (alunoNotas.av2Id) {
            await notaService.update(alunoNotas.av2Id, notaData);
          } else {
            await notaService.create(notaData as Parameters<typeof notaService.create>[0]);
          }
        }

        // Save RP1 if set
        if (alunoNotas.rp1 !== null) {
          if (alunoNotas.rp1Id) {
            await notaService.update(alunoNotas.rp1Id, { valor: alunoNotas.rp1 });
          } else {
            await notaService.create({
              alunoId: aluno.id,
              turmaId: serieId,
              disciplinaId,
              professorId: usuario.id,
              bimestre: bimestre as 1 | 2 | 3 | 4,
              tipo: 'REC',
              valor: alunoNotas.rp1,
              ano,
            });
          }
        }

        // Save RP2 if set
        if (alunoNotas.rp2 !== null) {
          if (alunoNotas.rp2Id) {
            await notaService.update(alunoNotas.rp2Id, { valor: alunoNotas.rp2 });
          } else {
            await notaService.create({
              alunoId: aluno.id,
              turmaId: serieId,
              disciplinaId,
              professorId: usuario.id,
              bimestre: bimestre as 1 | 2 | 3 | 4,
              tipo: 'REC',
              valor: alunoNotas.rp2,
              ano,
            });
          }
        }
      }

      addToast('Notas salvas com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving notas:', error);
      addToast('Erro ao salvar notas', 'error');
    } finally {
      setSaving(false);
    }
  }, [serieId, disciplinaId, usuario, alunos, notas, ano, bimestre, getModoCell, addToast]);

  const isLoading = loadingTurmas || loadingDisciplinas || loadingAlunos || loadingNotas;

  return (
    <MainLayout title="Notas" showSidebar>
      {/* Tabs Menu */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<Star />} iconPosition="start" label="Nota" />
          <Tab icon={<Grading />} iconPosition="start" label="Avaliação por Rubricas" />
          <Tab icon={<ListAlt />} iconPosition="start" label="Rubricas" />
        </Tabs>
      </Paper>

      {/* Tab: Nota */}
      <TabPanel value={tabValue} index={0}>
        <Box>
          {/* Filters Section */}
          <NotasFilters
            ano={ano}
            setAno={setAno}
            serieId={serieId}
            setSerieId={setSerieId}
            disciplinaId={disciplinaId}
            setDisciplinaId={setDisciplinaId}
            bimestre={bimestre}
            setBimestre={setBimestre}
            turmas={turmas}
            disciplinas={disciplinas}
            loadingTurmas={loadingTurmas}
            loadingDisciplinas={loadingDisciplinas}
          />

          {/* Main Content */}
          <Box>
            {!serieId || !disciplinaId ? (
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
                <Star sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                <Typography variant="body1" color="primary.main">
                  Selecione a turma e disciplina para lançar notas
                </Typography>
              </Paper>
            ) : isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress />
              </Box>
            ) : alunos.length === 0 ? (
              <Alert severity="info">
                Nenhum aluno encontrado nesta turma. Cadastre alunos primeiro.
              </Alert>
            ) : (
              <NotasTable
                alunos={alunos}
                notas={notas}
                modosCells={modosCells}
                saving={saving}
                getModoCell={getModoCell}
                handleNotaChange={handleNotaChange}
                calcularMedia={calcularMedia}
                handleSaveNotas={handleSaveNotas}
                handleOpenTemplateModal={handleOpenTemplateModal}
                handleSelectModo={handleSelectModo}
                openCompositionModal={openCompositionModal}
              />
            )}
          </Box>
        </Box>
      </TabPanel>

      {/* Tab: Avaliação por Rubricas */}
      <TabPanel value={tabValue} index={1}>
        <AvaliacaoRubricasTab
          ano={ano}
          turmaId={serieId}
          disciplinaId={disciplinaId}
          bimestre={bimestre}
          turmas={turmas}
          disciplinas={todasDisciplinas}
          loadingTurmas={loadingTurmas}
          loadingDisciplinas={loadingDisciplinas}
          onAnoChange={setAno}
          onTurmaChange={setSerieId}
          onDisciplinaChange={setDisciplinaId}
          onBimestreChange={setBimestre}
          alunos={alunos}
          rubricas={rubricas}
          loadingAlunos={loadingAlunos || loadingRubricas}
        />
      </TabPanel>

      {/* Tab: Rubricas */}
      <TabPanel value={tabValue} index={2}>
        <RubricasTab
          rubricas={rubricas}
          loading={loadingRubricas}
          onRefresh={refetchRubricas}
        />
      </TabPanel>

      {/* Template Modal */}
      <TemplateModal
        open={templateModalOpen}
        editingAv={editingTemplateAv}
        templateSubNotas={templateSubNotas}
        novaSubNota={novaSubNota}
        setNovaSubNota={setNovaSubNota}
        onClose={handleCloseTemplateModal}
        onSave={handleSaveTemplate}
        onAddSubNota={handleAddTemplateSubNota}
        onRemoveSubNota={handleRemoveTemplateSubNota}
        onPorcentagemChange={handleTemplateSubNotaPorcentagemChange}
        onRubricasChange={handleTemplateSubNotaRubricasChange}
      />

      {/* Composicao Modal */}
      <ComposicaoModal
        open={notasModalOpen}
        subNotas={subNotas}
        saving={savingComposicao}
        onClose={closeCompositionModal}
        onSave={handleSaveNotasComposicao}
        onValorChange={handleSubNotaValorChange}
        getTotalValoresMax={getTotalValoresMax}
        calcularNotaComposicao={calcularNotaComposicao}
        gerarFormulaDetalhada={gerarFormulaDetalhada}
      />
    </MainLayout>
  );
}
