'use client';

import { useEffect, useCallback, useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { Grade } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useFilterStore } from '@/store/filterStore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { useTurmas, useDisciplinas, useAlunosByTurma } from '@/hooks/useFirestoreData';
import { notaService } from '@/services/firestore';

// Local imports
import { ModoEntrada, parseCellKey } from './types';
import { useNotasData, useNotasTemplates, useNotasComposition } from './hooks';
import { NotasFilters, NotasTable, TemplateModal, ComposicaoModal } from './components';

export default function NotasPage() {
  const { ano, setAno, serieId, setSerieId, disciplinaId, setDisciplinaId, bimestre, setBimestre } = useFilterStore();
  const { addToast } = useUIStore();
  const { usuario } = useAuth();

  // Firebase data hooks
  const { turmas, loading: loadingTurmas } = useTurmas(ano);
  const { disciplinas: todasDisciplinas, loading: loadingDisciplinas } = useDisciplinas();
  const { alunos, loading: loadingAlunos } = useAlunosByTurma(serieId || null);

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
    getTemplate,
  } = useNotasTemplates();

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
      <Box sx={{ display: 'flex', gap: { xs: 0, md: 3 }, flexDirection: { xs: 'column', md: 'row' } }}>
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
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {!serieId || !disciplinaId ? (
            <Box sx={{ p: 6, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2 }}>
              <Grade sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Selecione a turma e disciplina para lancar notas
              </Typography>
            </Box>
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
