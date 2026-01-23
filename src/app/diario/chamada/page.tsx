'use client';

/**
 * Pagina de chamada - registra presencas dos alunos.
 */

import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Tabs, Tab, Paper } from '@mui/material';
import { Person, Edit as EditIcon, Assessment as ReportIcon } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useFilterStore } from '@/store/filterStore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { useTurmas, useDisciplinas, useAlunosByTurma } from '@/hooks/useFirestoreData';
import { useChamadaData } from './hooks';
import { ChamadaFilters, ChamadaList, ConteudoModal, RelatoriosChamada } from './components';

export default function ChamadaPage() {
  const { ano, setAno, serieId, setSerieId, disciplinaId, setDisciplinaId } = useFilterStore();
  const { addToast } = useUIStore();
  const { usuario } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Firebase data hooks
  const { turmas: todasTurmas, loading: loadingTurmas } = useTurmas(ano);
  const { disciplinas: todasDisciplinas, loading: loadingDisciplinas } = useDisciplinas();
  const { alunos, loading: loadingAlunos } = useAlunosByTurma(serieId || null);

  // Filter turmas by professor's vinculos (professors only see their turmas)
  const turmas = usuario?.tipo === 'professor'
    ? todasTurmas.filter(t => usuario.turmaIds?.includes(t.id))
    : todasTurmas;

  // Filter disciplinas by selected turma AND professor's vinculos
  const disciplinas = serieId
    ? todasDisciplinas.filter(d => {
        const isLinkedToTurma = d.turmaIds?.includes(serieId);
        const isProfessor = usuario?.tipo === 'professor';
        const isLinkedToProfessor = !isProfessor || usuario.disciplinaIds?.includes(d.id);
        return isLinkedToTurma && isLinkedToProfessor;
      })
    : [];

  // Local state for date and modal
  const [dataChamada, setDataChamada] = useState(new Date().toISOString().split('T')[0]);
  const [conteudoModalOpen, setConteudoModalOpen] = useState(false);
  const [dataConteudo, setDataConteudo] = useState(new Date().toISOString().split('T')[0]);

  // Chamada data hook
  const {
    presencas,
    observacoes,
    conteudo,
    setConteudo,
    loading: loadingChamada,
    saving,
    totalPresentes,
    totalAusentes,
    handlePresencaChange,
    handleObservacaoChange,
    handleMarcarTodos,
    handleSaveChamada,
  } = useChamadaData({
    serieId,
    disciplinaId,
    dataChamada,
    alunos,
  });

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

  const handleSaveConteudo = () => {
    addToast('Conteudo sera salvo junto com a chamada', 'info');
    setConteudoModalOpen(false);
  };

  const isLoading = loadingTurmas || loadingDisciplinas || loadingAlunos || loadingChamada;

  return (
    <MainLayout title="Chamada" showSidebar>
      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab
            icon={<EditIcon />}
            iconPosition="start"
            label="Registrar Chamada"
            sx={{ minHeight: 56 }}
          />
          <Tab
            icon={<ReportIcon />}
            iconPosition="start"
            label="Relatorios"
            sx={{ minHeight: 56 }}
          />
        </Tabs>
      </Paper>

      {/* Tab: Registrar Chamada */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', gap: { xs: 0, md: 1.5 }, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Filters Section */}
          <ChamadaFilters
            ano={ano}
            setAno={setAno}
            serieId={serieId}
            setSerieId={setSerieId}
            disciplinaId={disciplinaId}
            setDisciplinaId={setDisciplinaId}
            dataChamada={dataChamada}
            setDataChamada={setDataChamada}
            turmas={turmas}
            disciplinas={disciplinas}
            loadingTurmas={loadingTurmas}
            loadingDisciplinas={loadingDisciplinas}
          />

          {/* Main Content - Student List */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {!serieId || !disciplinaId ? (
              <Box
                sx={{
                  p: 6,
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                }}
              >
                <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Selecione a turma e disciplina para iniciar a chamada
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
              <ChamadaList
                alunos={alunos}
                presencas={presencas}
                observacoes={observacoes}
                totalPresentes={totalPresentes}
                totalAusentes={totalAusentes}
                saving={saving}
                onPresencaChange={handlePresencaChange}
                onObservacaoChange={handleObservacaoChange}
                onMarcarTodos={handleMarcarTodos}
                onSave={handleSaveChamada}
                onOpenConteudo={() => setConteudoModalOpen(true)}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Tab: Relatorios */}
      {activeTab === 1 && (
        <Paper sx={{ overflow: 'hidden' }}>
          <RelatoriosChamada
            professor={usuario}
            turmas={turmas}
            disciplinas={usuario?.tipo === 'professor'
              ? todasDisciplinas.filter(d => usuario.disciplinaIds?.includes(d.id))
              : todasDisciplinas}
          />
        </Paper>
      )}

      {/* Conteudo Modal */}
      <ConteudoModal
        open={conteudoModalOpen}
        dataConteudo={dataConteudo}
        conteudo={conteudo}
        onClose={() => setConteudoModalOpen(false)}
        onDataChange={setDataConteudo}
        onConteudoChange={setConteudo}
        onSave={handleSaveConteudo}
      />
    </MainLayout>
  );
}
