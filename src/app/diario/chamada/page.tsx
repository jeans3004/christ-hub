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
import { ChamadaFilters, ChamadaList, ConteudoModal, RelatoriosChamada, TrilhasView, TrilhasConfig, SalvarChamadaModal, EAlunoConfigModal, AlunosDisciplinaTab, PreparatorioTab, SyncResultModal } from './components';
import { eAlunoConfigService } from '@/services/firestore/eAlunoConfigService';
import { Atestado, Atraso, EAlunoConfig } from '@/types';

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

  // E-Aluno (SGE) integration
  const [eAlunoConfig, setEAlunoConfig] = useState<EAlunoConfig | null>(null);
  const [eAlunoConfigOpen, setEAlunoConfigOpen] = useState(false);
  const [syncingSGE, setSyncingSGE] = useState(false);
  const [autoSyncSGE, setAutoSyncSGE] = useState(false);
  const [syncResult, setSyncResult] = useState<{ luminar: boolean; sge: boolean; sgeMessage: string } | null>(null);

  // Load autoSyncSGE from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chamada-auto-sync-sge');
      if (saved === 'true') setAutoSyncSGE(true);
    } catch {}
  }, []);

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

  // Load e-aluno config
  useEffect(() => {
    if (!usuario?.id) return;
    eAlunoConfigService.getByUser(usuario.id).then(setEAlunoConfig).catch(() => {});
  }, [usuario?.id]);

  // Normalize name for matching: lowercase, remove accents, trim
  const normalizeName = (name: string) =>
    name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Aliases: Luminar name -> e-aluno name (when names differ between systems)
  const disciplinaAliases: Record<string, string> = {
    'robotica e educacao digital': 'pensamento computacional',
    'educacao digital': 'pensamento computacional',
    'robotica': 'pensamento computacional',
  };

  // Send chamada to e-aluno (SGE) - returns result for SyncResultModal
  const handleEnviarSGE = async (): Promise<{ success: boolean; message: string }> => {
    if (!usuario?.id) return { success: false, message: 'Usuario nao autenticado' };

    // Check if config exists
    const config = eAlunoConfig || await eAlunoConfigService.getByUser(usuario.id);
    if (!config?.credentials?.user || !config?.credentials?.password) {
      return { success: false, message: 'Credenciais SGE nao configuradas' };
    }

    if (!serieId || !disciplinaId) {
      return { success: false, message: 'Selecione turma e disciplina' };
    }

    try {
      const turmaMap = config.turmaMap?.[serieId];
      const discMap = config.disciplinaMap?.[disciplinaId];

      if (!turmaMap || !discMap) {
        // Need to discover mappings - fetch e-aluno data and auto-match

        // Login and fetch page data
        const loginRes = await fetch('/api/ealuno/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: config.credentials.user,
            password: config.credentials.password,
          }),
        });

        const loginData = await loginRes.json();
        if (!loginData.success) {
          return { success: false, message: `Erro no e-aluno: ${loginData.error}` };
        }

        // Auto-match turma from combined cmbSerie options
        if (!turmaMap && turmaSelecionada) {
          const options: Array<{ serie: number; turma: number; turno: string; label: string }> = loginData.data.options || [];
          const turno = turmaSelecionada.turno || '';
          const serieName = turmaSelecionada.serie || '';
          const turmaLetter = (turmaSelecionada.turma || '').trim();

          const matched = options.find(opt => {
            if (normalizeName(opt.turno) !== normalizeName(turno)) return false;
            if (serieName && !normalizeName(opt.label).includes(normalizeName(serieName))) return false;
            if (turmaLetter) {
              const bracketMatch = opt.label.match(/\[\s*\S+\s+(\S+)\s*\]/);
              if (!bracketMatch || bracketMatch[1].toUpperCase() !== turmaLetter.toUpperCase()) return false;
            }
            return true;
          });

          if (matched) {
            await eAlunoConfigService.saveTurmaMap(usuario.id, serieId, {
              serie: matched.serie,
              turma: matched.turma,
              turno: matched.turno,
            });
          } else {
            return { success: false, message: 'Nao foi possivel mapear a turma automaticamente' };
          }
        }

        // Reload config after mapping
        const updatedConfig = await eAlunoConfigService.getByUser(usuario.id);
        if (updatedConfig) setEAlunoConfig(updatedConfig);

        // If still missing disciplina mapping, try to fetch and match
        if (!discMap) {
          const tm = updatedConfig?.turmaMap?.[serieId] || turmaMap;
          if (tm) {
            const dataRes = await fetch('/api/ealuno/data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user: config.credentials.user,
                password: config.credentials.password,
                serie: tm.serie,
                turma: tm.turma,
                turno: tm.turno,
                ano,
                fetch: 'disciplinas',
              }),
            });

            const dataResult = await dataRes.json();
            if (dataResult.success && dataResult.data.disciplinas) {
              const disciplinaLuminar = todasDisciplinas.find(d => d.id === disciplinaId);
              if (disciplinaLuminar) {
                const normalizedDisc = normalizeName(disciplinaLuminar.nome);
                const aliasName = disciplinaAliases[normalizedDisc];
                const matched = dataResult.data.disciplinas.find(
                  (d: { id: number; nome: string }) => {
                    const normalizedEAluno = normalizeName(d.nome);
                    return normalizedEAluno === normalizedDisc ||
                      normalizedEAluno.includes(normalizedDisc) ||
                      normalizedDisc.includes(normalizedEAluno) ||
                      (aliasName && normalizedEAluno.includes(aliasName));
                  }
                );
                if (matched) {
                  await eAlunoConfigService.saveDisciplinaMap(usuario.id, disciplinaId, matched.id);
                } else {
                  return { success: false, message: `Disciplina "${disciplinaLuminar.nome}" nao encontrada no e-aluno` };
                }
              }
            }
          }
        }

        // Reload config with all mappings
        const finalConfig = await eAlunoConfigService.getByUser(usuario.id);
        if (finalConfig) setEAlunoConfig(finalConfig);

        const tm2 = finalConfig?.turmaMap?.[serieId];
        const dm2 = finalConfig?.disciplinaMap?.[disciplinaId];
        if (!tm2 || !dm2) {
          return { success: false, message: 'Mapeamento incompleto. Configure manualmente.' };
        }

        return await autoMatchAndSubmit(finalConfig!, tm2, dm2);
      }

      // Mappings exist - proceed directly
      return await autoMatchAndSubmit(config, turmaMap, discMap);
    } catch (error) {
      console.error('Erro ao enviar para SGE:', error);
      return { success: false, message: 'Erro ao enviar chamada para o e-aluno' };
    }
  };

  const autoMatchAndSubmit = async (
    config: EAlunoConfig,
    turmaMap: { serie: number; turma: number; turno: string },
    disciplinaId_eAluno: number
  ): Promise<{ success: boolean; message: string }> => {
    // Fetch e-aluno students to match
    const dataRes = await fetch('/api/ealuno/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: config.credentials.user,
        password: config.credentials.password,
        serie: turmaMap.serie,
        turma: turmaMap.turma,
        turno: turmaMap.turno,
        ano,
        fetch: 'alunos',
      }),
    });

    const dataResult = await dataRes.json();
    if (!dataResult.success || !dataResult.data.alunos) {
      return { success: false, message: 'Erro ao buscar alunos do e-aluno' };
    }

    const eAlunoStudents: Array<{ id: number; nome: string }> = dataResult.data.alunos;

    // Build aluno mapping (auto-match by name)
    const alunoMap: Record<string, number> = { ...config.alunoMap };
    const unmatchedLuminar: string[] = [];

    for (const aluno of alunosFiltrados) {
      if (alunoMap[aluno.id]) continue;

      const normalizedAluno = normalizeName(aluno.nome);
      const matched = eAlunoStudents.find(ea => normalizeName(ea.nome) === normalizedAluno);

      if (matched) {
        alunoMap[aluno.id] = matched.id;
      } else {
        const parts = normalizedAluno.split(' ');
        const firstName = parts[0];
        const lastName = parts[parts.length - 1];
        const partialMatch = eAlunoStudents.find(ea => {
          const eaParts = normalizeName(ea.nome).split(' ');
          return eaParts[0] === firstName && eaParts[eaParts.length - 1] === lastName;
        });

        if (partialMatch) {
          alunoMap[aluno.id] = partialMatch.id;
        } else {
          unmatchedLuminar.push(aluno.nome);
        }
      }
    }

    // Save updated mappings
    if (Object.keys(alunoMap).length > Object.keys(config.alunoMap || {}).length) {
      await eAlunoConfigService.saveAlunoMap(usuario!.id, alunoMap);
    }

    // Build presencas map considering atestados and atrasos
    const presencasEfetivas: Record<string, boolean> = {};
    for (const aluno of alunosFiltrados) {
      if (!alunoMap[aluno.id]) continue;
      const atestado = atestadosVigentes[aluno.id];
      const atraso = atrasosHoje[aluno.id];
      const atrasoAtivo = atraso && isPrimeiroTempo;

      if (atestado) {
        presencasEfetivas[aluno.id] = true;
      } else if (atrasoAtivo) {
        presencasEfetivas[aluno.id] = false;
      } else {
        presencasEfetivas[aluno.id] = presencas[aluno.id] ?? true;
      }
    }

    // Submit to e-aluno
    const res = await fetch('/api/ealuno/chamada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: config.credentials.user,
        password: config.credentials.password,
        serie: turmaMap.serie,
        turma: turmaMap.turma,
        turno: turmaMap.turno,
        disciplina: disciplinaId_eAluno,
        ano,
        data: dataChamada,
        aula: 1,
        alunoMap,
        presencas: presencasEfetivas,
      }),
    });

    const result = await res.json();
    if (result.success) {
      const warning = unmatchedLuminar.length > 0
        ? ` (${unmatchedLuminar.length} aluno(s) nao mapeados)`
        : '';
      return { success: true, message: `Chamada enviada (${result.presentCount} presentes)${warning}` };
    } else {
      return { success: false, message: `Erro no e-aluno: ${result.error || result.message}` };
    }
  };

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
                syncingSGE={syncingSGE}
                onPresencaChange={handlePresencaChange}
                onObservacaoChange={handleObservacaoChange}
                onMarcarTodos={handleMarcarTodos}
                onSave={() => setShowSaveModal(true)}
                onOpenConteudo={() => setConteudoModalOpen(true)}
                onEnviarSGE={() => setEAlunoConfigOpen(true)}
                autoSyncSGE={autoSyncSGE}
                onAutoSyncToggle={(v) => {
                  setAutoSyncSGE(v);
                  try { localStorage.setItem('chamada-auto-sync-sge', String(v)); } catch {}
                }}
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
          const luminarOk = await handleSaveChamada(quantidade, tempoInicial);
          setShowSaveModal(false);
          if (autoSyncSGE) {
            setSyncingSGE(true);
            const sgeResult = await handleEnviarSGE();
            setSyncingSGE(false);
            setSyncResult({ luminar: !!luminarOk, sge: sgeResult.success, sgeMessage: sgeResult.message });

            // Mark sgeSyncedAt on the chamada(s) we just saved
            if (sgeResult.success && serieId && disciplinaId) {
              try {
                const savedChamadas = await chamadaService.getByTurmaData(
                  serieId,
                  new Date(dataChamada + 'T12:00:00')
                );
                for (const c of savedChamadas) {
                  if (c.disciplinaId === disciplinaId && !c.sgeSyncedAt) {
                    await chamadaService.update(c.id, { sgeSyncedAt: new Date() });
                  }
                }
              } catch (e) {
                console.error('Erro ao marcar sgeSyncedAt:', e);
              }
            }
          }
        }}
      />

      {/* E-Aluno Config Modal */}
      <EAlunoConfigModal
        open={eAlunoConfigOpen}
        onClose={() => setEAlunoConfigOpen(false)}
        onConfigSaved={(config) => setEAlunoConfig(config)}
      />

      {/* Sync Result Modal */}
      {syncResult && (
        <SyncResultModal
          open={!!syncResult}
          onClose={() => setSyncResult(null)}
          luminar={syncResult.luminar}
          sge={syncResult.sge}
          sgeMessage={syncResult.sgeMessage}
        />
      )}
    </MainLayout>
  );
}
