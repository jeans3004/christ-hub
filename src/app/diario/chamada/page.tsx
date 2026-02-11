'use client';

/**
 * Pagina de chamada - registra presencas dos alunos.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert, Tabs, Tab, Paper } from '@mui/material';
import { Person, Edit as EditIcon, Assessment as ReportIcon, Route as TrilhasIcon, PeopleOutline, School } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useFilterStore } from '@/store/filterStore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { useTurmas, useDisciplinas, useAlunosByTurma } from '@/hooks/useFirestoreData';
import { chamadaService } from '@/services/firestore';
import { atestadoService } from '@/services/firestore/atestadoService';
import { atrasoService } from '@/services/firestore/atrasoService';
import { useChamadaData } from './hooks';
import { ChamadaFilters, ChamadaList, ConteudoModal, RelatoriosChamada, TrilhasView, TrilhasConfig, SalvarChamadaModal, AlunosDisciplinaTab, PreparatorioTab } from './components';
import { Atestado, Atraso } from '@/types';

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
  // Fallback: if professor has no turmaIds, show turmas that have their disciplinas
  const turmas = usuario?.tipo === 'professor'
    ? (() => {
        const profTurmas = usuario.turmaIds || [];
        const profDisciplinas = usuario.disciplinaIds || [];

        // Se tem turmas vinculadas, usa elas
        if (profTurmas.length > 0) {
          return todasTurmas.filter(t => profTurmas.includes(t.id));
        }

        // Fallback: turmas que tem as disciplinas do professor
        if (profDisciplinas.length > 0) {
          return todasTurmas.filter(t =>
            todasDisciplinas.some(d =>
              d.turmaIds?.includes(t.id) &&
              (profDisciplinas.includes(d.id) || (d.parentId && profDisciplinas.includes(d.parentId)))
            )
          );
        }

        return [];
      })()
    : todasTurmas;

  // Filter disciplinas by selected turma AND professor's vinculos
  // Also includes child disciplinas of the ones professor is linked to
  const disciplinas = serieId
    ? todasDisciplinas.filter(d => {
        const isLinkedToTurma = d.turmaIds?.includes(serieId);
        if (!isLinkedToTurma) return false;

        // Coordenadores e admins veem todas
        if (usuario?.tipo !== 'professor') return true;

        const profDisciplinas = usuario.disciplinaIds || [];
        // Disciplina diretamente vinculada ao professor
        if (profDisciplinas.includes(d.id)) return true;
        // Disciplina filha de uma vinculada ao professor
        if (d.parentId && profDisciplinas.includes(d.parentId)) return true;

        return false;
      })
    : [];

  // Local state for date and modal
  const [dataChamada, setDataChamada] = useState(new Date().toISOString().split('T')[0]);
  const [conteudoModalOpen, setConteudoModalOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [dataConteudo, setDataConteudo] = useState(new Date().toISOString().split('T')[0]);

  // Obter turno da turma selecionada
  const turmaSelecionada = turmas.find(t => t.id === serieId);

  // Calcular se estamos no 1o tempo (para logica de atrasos)
  const isPrimeiroTempo = (() => {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    const turno = turmaSelecionada?.turno;
    if (turno === 'Matutino') return totalMinutes >= 7 * 60 && totalMinutes < 7 * 60 + 45;
    if (turno === 'Vespertino') return totalMinutes >= 13 * 60 && totalMinutes < 13 * 60 + 45;
    return false;
  })();

  // Atrasos do dia para a turma
  const [atrasosHoje, setAtrasosHoje] = useState<Record<string, Atraso>>({});

  // Carregar atrasos quando turma/data mudar
  const loadAtrasos = useCallback(async () => {
    if (!serieId || !dataChamada) {
      setAtrasosHoje({});
      return;
    }

    try {
      const data = new Date(dataChamada + 'T12:00:00');
      const atrasos = await atrasoService.getByTurmaData(serieId, data);

      const record: Record<string, Atraso> = {};
      atrasos.forEach(a => {
        record[a.alunoId] = a;
      });
      setAtrasosHoje(record);
    } catch (error) {
      console.error('Erro ao carregar atrasos:', error);
    }
  }, [serieId, dataChamada]);

  useEffect(() => {
    loadAtrasos();
  }, [loadAtrasos]);

  // IDs dos alunos atrasados que devem ser bloqueados como ausente (so no 1o tempo)
  const atrasadosIds = isPrimeiroTempo ? Object.keys(atrasosHoje) : [];

  // Filtrar alunos pela whitelist da disciplina selecionada
  const alunosFiltrados = useMemo(() => {
    if (!disciplinaId || !serieId) return alunos;
    const disciplina = todasDisciplinas.find(d => d.id === disciplinaId);
    const whitelist = disciplina?.alunosPorTurma?.[serieId];
    if (!whitelist?.length) return alunos;
    const whitelistSet = new Set(whitelist);
    return alunos.filter(a => whitelistSet.has(a.id));
  }, [alunos, disciplinaId, serieId, todasDisciplinas]);

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
    alunos: alunosFiltrados,
    turno: turmaSelecionada?.turno,
    atrasadosIds,
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

  // Atestados vigentes para a turma na data selecionada
  const [atestadosVigentes, setAtestadosVigentes] = useState<Record<string, Atestado>>({});

  // Carregar atestados vigentes quando turma/data mudar
  const loadAtestados = useCallback(async () => {
    if (!serieId || !dataChamada) {
      setAtestadosVigentes({});
      return;
    }

    try {
      const data = new Date(dataChamada + 'T12:00:00');
      const atestados = await atestadoService.getVigentesTurma(serieId, data);

      // Converter array para record por alunoId
      const record: Record<string, Atestado> = {};
      atestados.forEach(a => {
        record[a.alunoId] = a;
      });
      setAtestadosVigentes(record);
    } catch (error) {
      console.error('Erro ao carregar atestados:', error);
    }
  }, [serieId, dataChamada]);

  useEffect(() => {
    loadAtestados();
  }, [loadAtestados]);

  const handleSaveConteudo = async (tempoInicial: number, quantidade: number) => {
    if (!serieId || !disciplinaId) {
      addToast('Selecione turma e disciplina', 'error');
      return;
    }

    try {
      const chamadas = await chamadaService.getByTurmaData(serieId, new Date(dataChamada + 'T12:00:00'));
      const tempos = [tempoInicial];
      if (quantidade === 2 && tempoInicial < 7) tempos.push(tempoInicial + 1);

      let salvou = false;
      for (const tempo of tempos) {
        const chamadaExistente = chamadas.find(c => c.disciplinaId === disciplinaId && c.tempo === tempo);
        if (chamadaExistente) {
          await chamadaService.update(chamadaExistente.id, { conteudo: conteudo || undefined });
          salvou = true;
        }
      }

      if (salvou) {
        addToast(quantidade === 2 ? 'Conteudo salvo em 2 tempos!' : 'Conteudo salvo com sucesso!', 'success');
      } else {
        addToast('Conteudo sera salvo junto com a chamada', 'info');
      }
    } catch (error) {
      console.error('Erro ao salvar conteudo:', error);
      addToast('Erro ao salvar conteudo', 'error');
    }

    setConteudoModalOpen(false);
  };

  const isLoading = loadingTurmas || loadingDisciplinas || loadingAlunos || loadingChamada;

  // Verificar se professor tem vinculos configurados
  const professorSemVinculos = usuario?.tipo === 'professor' &&
    (!usuario.disciplinaIds || usuario.disciplinaIds.length === 0);

  return (
    <MainLayout title="Chamada" showSidebar>
      {/* Alerta para professor sem vinculos */}
      {professorSemVinculos && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Seu cadastro nao possui disciplinas vinculadas. Entre em contato com a coordenacao para configurar seu acesso.
        </Alert>
      )}

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
            sx={{ minHeight: 56, '& .MuiTab-iconWrapper': { mr: { xs: 0, sm: 1 } }, fontSize: { xs: 0, sm: '0.875rem' }, minWidth: 0 }}
          />
          <Tab
            icon={<ReportIcon />}
            iconPosition="start"
            label="Relatorios"
            sx={{ minHeight: 56, '& .MuiTab-iconWrapper': { mr: { xs: 0, sm: 1 } }, fontSize: { xs: 0, sm: '0.875rem' }, minWidth: 0 }}
          />
          <Tab
            icon={<TrilhasIcon />}
            iconPosition="start"
            label="Trilhas"
            sx={{ minHeight: 56, '& .MuiTab-iconWrapper': { mr: { xs: 0, sm: 1 } }, fontSize: { xs: 0, sm: '0.875rem' }, minWidth: 0 }}
          />
          <Tab
            icon={<School />}
            iconPosition="start"
            label="Preparatorio"
            sx={{ minHeight: 56, '& .MuiTab-iconWrapper': { mr: { xs: 0, sm: 1 } }, fontSize: { xs: 0, sm: '0.875rem' }, minWidth: 0 }}
          />
          {usuario?.tipo !== 'professor' && (
            <Tab
              icon={<PeopleOutline />}
              iconPosition="start"
              label="Alunos por Disciplina"
              sx={{ minHeight: 56, '& .MuiTab-iconWrapper': { mr: { xs: 0, sm: 1 } }, fontSize: { xs: 0, sm: '0.875rem' }, minWidth: 0 }}
            />
          )}
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
            ) : alunosFiltrados.length === 0 ? (
              <Alert severity="info">
                Nenhum aluno encontrado nesta turma. Cadastre alunos primeiro.
              </Alert>
            ) : (
              <ChamadaList
                alunos={alunosFiltrados}
                presencas={presencas}
                observacoes={observacoes}
                atestadosVigentes={atestadosVigentes}
                atrasosHoje={atrasosHoje}
                isPrimeiroTempo={isPrimeiroTempo}
                totalPresentes={totalPresentes}
                totalAusentes={totalAusentes}
                saving={saving}
                onPresencaChange={handlePresencaChange}
                onObservacaoChange={handleObservacaoChange}
                onMarcarTodos={handleMarcarTodos}
                onSave={() => setShowSaveModal(true)}
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
              ? todasDisciplinas.filter(d => {
                  const profDisciplinas = usuario.disciplinaIds || [];
                  return profDisciplinas.includes(d.id) ||
                    (d.parentId && profDisciplinas.includes(d.parentId));
                })
              : todasDisciplinas}
          />
        </Paper>
      )}

      {/* Tab: Trilhas */}
      {activeTab === 2 && (
        usuario?.tipo === 'professor' ? (
          <TrilhasView
            ano={ano}
            dataChamada={dataChamada}
            setDataChamada={setDataChamada}
            professor={usuario}
          />
        ) : (
          <TrilhasConfig ano={ano} />
        )
      )}

      {/* Tab: Preparatorio */}
      {activeTab === 3 && (
        <PreparatorioTab />
      )}

      {/* Tab: Alunos por Disciplina (admin/coordenador only) */}
      {activeTab === 4 && usuario?.tipo !== 'professor' && (
        <AlunosDisciplinaTab />
      )}

      {/* Conteudo Modal */}
      <ConteudoModal
        open={conteudoModalOpen}
        dataConteudo={dataConteudo}
        conteudo={conteudo}
        turno={turmaSelecionada?.turno}
        onClose={() => setConteudoModalOpen(false)}
        onDataChange={setDataConteudo}
        onConteudoChange={setConteudo}
        onSave={handleSaveConteudo}
      />

      {/* Salvar Chamada Modal - escolher 1 ou 2 tempos */}
      <SalvarChamadaModal
        open={showSaveModal}
        turno={turmaSelecionada?.turno}
        saving={saving}
        onClose={() => setShowSaveModal(false)}
        onConfirm={async (quantidade, tempoInicial) => {
          await handleSaveChamada(quantidade, tempoInicial);
          setShowSaveModal(false);
        }}
      />
    </MainLayout>
  );
}
