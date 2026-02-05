'use client';

/**
 * Pagina de mapeamento de sala - Redesign com melhor UX.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Button,
  Tooltip,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Shuffle,
  ClearAll,
  Save,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Add,
  Settings,
  LockOpen,
  Lock,
  GridView,
  DeleteForever,
} from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useMapeamentoData } from './hooks';
import {
  MapeamentoFilters,
  ClassroomGrid,
  StudentList,
  TouchDragProvider,
  ProfessorTabs,
} from './components';
import { ModoEdicao } from './types';

export default function MapeamentoPage() {
  const { usuario } = useAuthStore();
  const { isCoordinatorOrAbove } = usePermissions();
  const {
    ano, setAno, turmaId, setTurmaId, turmas, alunos,
    disciplinaId, setDisciplinaId, disciplinas,
    loadingTurmas, loadingDisciplinas, loadingAlunos, loadingMapeamento,
    alunosDisponiveis, layout, celulas, modoEdicao, setModoEdicao,
    atualizarLayout, alternarTipoCelula, atribuirAluno, saving, salvar, resetar,
    distribuirAleatorio, limparTodos,
    mapeamentosDaTurma, professorIdVisualizando, setProfessorIdVisualizando, conselheiroId,
    turmaSelecionada, layoutConfigurado, salvarLayoutPadrao, toggleLayoutConfigurado,
    excluirMapeamento,
  } = useMapeamentoData();

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const loading = loadingAlunos || loadingMapeamento;
  const isVisualizando = !!professorIdVisualizando;

  // Verificar se o usuario pode configurar layout (admin, coord ou conselheiro da turma)
  const podeConfigurarLayout = isCoordinatorOrAbove() ||
    (usuario && turmaSelecionada?.professorConselheiroId === usuario.id);

  // Definir visualizacao padrao do conselheiro se existir e o usuario ainda nao tiver mapeamento
  useEffect(() => {
    if (turmaId && conselheiroId && mapeamentosDaTurma.length > 0 && usuario) {
      const meuMapeamento = mapeamentosDaTurma.find(m => m.professorId === usuario.id);
      const mapeamentoConselheiro = mapeamentosDaTurma.find(m => m.professorId === conselheiroId);
      if (!meuMapeamento && mapeamentoConselheiro && !professorIdVisualizando) {
        setProfessorIdVisualizando(conselheiroId);
      }
    }
  }, [turmaId, conselheiroId, mapeamentosDaTurma, usuario, professorIdVisualizando, setProfessorIdVisualizando]);

  const handleCelulaClick = useCallback((row: number, col: number) => {
    if (modoEdicao === 'visualizar') return;
    if (modoEdicao === 'editar_tipo') {
      alternarTipoCelula(row, col);
    } else if (modoEdicao === 'remover') {
      const celula = celulas.find(c => c.row === row && c.column === col);
      if (celula?.alunoId) atribuirAluno(row, col, null);
    }
  }, [modoEdicao, alternarTipoCelula, celulas, atribuirAluno]);

  const handleDrop = useCallback((row: number, col: number, alunoId: string) => {
    const celula = celulas.find(c => c.row === row && c.column === col);
    if (celula?.tipo !== 'mesa' && celula?.tipo !== undefined) return;
    atribuirAluno(row, col, alunoId);
  }, [celulas, atribuirAluno]);

  const handleSave = useCallback(async () => {
    try {
      await salvar();
      setSnackbar({ open: true, message: 'Mapeamento salvo com sucesso!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Erro ao salvar mapeamento', severity: 'error' });
    }
  }, [salvar]);

  const handleSaveLayoutPadrao = useCallback(async () => {
    try {
      await salvarLayoutPadrao(layout);
      setSnackbar({ open: true, message: 'Layout padrao salvo para a turma!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Erro ao salvar layout padrao', severity: 'error' });
    }
  }, [salvarLayoutPadrao, layout]);

  const handleToggleLayoutConfig = useCallback(async () => {
    try {
      await toggleLayoutConfigurado();
    } catch {
      setSnackbar({ open: true, message: 'Erro ao alterar configuracao', severity: 'error' });
    }
  }, [toggleLayoutConfigurado]);

  const handleExcluirMapeamento = useCallback(async () => {
    if (!confirm('Tem certeza que deseja excluir seu mapeamento? Esta acao nao pode ser desfeita.')) {
      return;
    }
    try {
      await excluirMapeamento();
    } catch {
      setSnackbar({ open: true, message: 'Erro ao excluir mapeamento', severity: 'error' });
    }
  }, [excluirMapeamento]);

  const mapModoEdicao = (modo: ModoEdicao): ModoEdicao => {
    if (modo === 'selecionar') return 'atribuir';
    if (modo === 'remover') return 'remover_aluno';
    return modo;
  };

  // Verificar se deve mostrar controles de layout (admin/coord ou layout nao configurado)
  const mostrarControlesLayout = podeConfigurarLayout || !layoutConfigurado;

  return (
    <MainLayout>
      <Box sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
        }}>
          <GridView sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" fontWeight={600}>
            Mapeamento de Sala
          </Typography>
        </Box>

        {/* Filtros */}
        <MapeamentoFilters
          ano={ano} setAno={setAno} turmaId={turmaId} setTurmaId={setTurmaId}
          turmas={turmas} loadingTurmas={loadingTurmas}
          disciplinaId={disciplinaId} setDisciplinaId={setDisciplinaId}
          disciplinas={disciplinas} loadingDisciplinas={loadingDisciplinas}
        />

        {!turmaId ? (
          <Paper
            elevation={0}
            sx={{
              textAlign: 'center',
              py: 6,
              px: 3,
              bgcolor: 'grey.50',
              borderRadius: 3,
              border: '2px dashed',
              borderColor: 'grey.300',
            }}
          >
            <GridView sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={500}>
              Selecione uma turma
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Escolha uma turma para visualizar ou criar o mapeamento de sala
            </Typography>
          </Paper>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Tabs de professores */}
            {mapeamentosDaTurma.length > 0 && usuario && (
              <ProfessorTabs
                mapeamentos={mapeamentosDaTurma}
                professorIdVisualizando={professorIdVisualizando}
                onProfessorChange={setProfessorIdVisualizando}
                conselheiroId={conselheiroId}
                usuarioId={usuario.id}
              />
            )}

            {/* Toolbar de edicao */}
            {!isVisualizando && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  mb: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}>
                  {/* Modos de edicao */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Visualizar">
                      <Button
                        size="small"
                        variant={modoEdicao === 'visualizar' ? 'contained' : 'outlined'}
                        onClick={() => setModoEdicao('visualizar')}
                        sx={{ minWidth: 40, px: 1 }}
                      >
                        <Visibility fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Atribuir alunos (arraste)">
                      <Button
                        size="small"
                        variant={modoEdicao === 'selecionar' ? 'contained' : 'outlined'}
                        onClick={() => setModoEdicao('selecionar')}
                        sx={{ minWidth: 40, px: 1 }}
                      >
                        <Add fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Editar tipo de celula">
                      <Button
                        size="small"
                        variant={modoEdicao === 'editar_tipo' ? 'contained' : 'outlined'}
                        onClick={() => setModoEdicao('editar_tipo')}
                        sx={{ minWidth: 40, px: 1 }}
                      >
                        <Edit fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Remover aluno">
                      <Button
                        size="small"
                        variant={modoEdicao === 'remover' ? 'contained' : 'outlined'}
                        onClick={() => setModoEdicao('remover')}
                        sx={{ minWidth: 40, px: 1 }}
                      >
                        <Delete fontSize="small" />
                      </Button>
                    </Tooltip>
                  </Box>

                  {/* Acoes rapidas */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Tooltip title="Distribuir aleatoriamente">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Shuffle />}
                        onClick={distribuirAleatorio}
                        disabled={alunos.length === 0}
                        sx={{ textTransform: 'none' }}
                      >
                        Aleatorio
                      </Button>
                    </Tooltip>
                    <Tooltip title="Limpar todos">
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={<ClearAll />}
                        onClick={limparTodos}
                        disabled={!celulas.some(c => c.alunoId)}
                        sx={{ textTransform: 'none' }}
                      >
                        Limpar
                      </Button>
                    </Tooltip>
                    <Tooltip title="Resetar layout para o padrao">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={resetar}
                        sx={{ textTransform: 'none' }}
                      >
                        Resetar
                      </Button>
                    </Tooltip>
                    <Tooltip title="Excluir meu mapeamento permanentemente">
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteForever />}
                        onClick={handleExcluirMapeamento}
                        disabled={saving}
                        sx={{ textTransform: 'none' }}
                      >
                        Excluir
                      </Button>
                    </Tooltip>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                      onClick={handleSave}
                      disabled={saving}
                      sx={{ textTransform: 'none' }}
                    >
                      {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </Box>
                </Box>

                {/* Instrucoes do modo */}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {modoEdicao === 'visualizar' && 'Modo visualizacao - selecione um modo de edicao'}
                  {modoEdicao === 'selecionar' && 'Arraste um aluno da lista para uma mesa, ou troque de lugar arrastando entre mesas'}
                  {modoEdicao === 'editar_tipo' && 'Clique em uma celula para alterar o tipo (mesa → vazio → professor)'}
                  {modoEdicao === 'remover' && 'Clique em uma mesa ocupada para remover o aluno'}
                </Typography>
              </Paper>
            )}

            {/* Configuracao de layout da turma (para admin/coord/conselheiro) */}
            {!isVisualizando && podeConfigurarLayout && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  mb: 2,
                  bgcolor: 'info.light',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Settings sx={{ color: 'info.dark' }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="info.dark">
                      Configuracao de Layout da Turma
                    </Typography>
                    <Typography variant="caption" color="info.dark">
                      {layoutConfigurado
                        ? 'Layout padrao definido. Professores nao podem alterar linhas/colunas.'
                        : 'Defina o layout padrao para esta turma.'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Salvar layout atual como padrao da turma">
                    <Button
                      size="small"
                      variant="contained"
                      color="info"
                      startIcon={<Save />}
                      onClick={handleSaveLayoutPadrao}
                      sx={{ textTransform: 'none' }}
                    >
                      Salvar Padrao
                    </Button>
                  </Tooltip>
                  <Tooltip title={layoutConfigurado ? 'Reabrir configuracao de layout' : 'Bloquear layout'}>
                    <IconButton
                      size="small"
                      onClick={handleToggleLayoutConfig}
                      sx={{
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'grey.200' },
                      }}
                    >
                      {layoutConfigurado ? <LockOpen /> : <Lock />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            )}

            {/* Grid e lista de alunos */}
            <TouchDragProvider>
              <Box sx={{
                display: 'flex',
                gap: 2,
                flexDirection: { xs: 'column', md: 'row' },
              }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <ClassroomGrid
                    layout={layout}
                    celulas={celulas}
                    modoEdicao={isVisualizando ? 'visualizar' : mapModoEdicao(modoEdicao)}
                    selectedCell={null}
                    onCelulaClick={isVisualizando ? () => {} : handleCelulaClick}
                    onDrop={isVisualizando ? () => {} : handleDrop}
                    onLayoutChange={isVisualizando ? () => {} : atualizarLayout}
                    showLayoutControls={mostrarControlesLayout && !isVisualizando}
                  />
                </Box>
                {modoEdicao === 'selecionar' && !isVisualizando && (
                  <StudentList
                    alunosDisponiveis={alunosDisponiveis}
                    totalAlunos={alunos.length}
                    loading={loadingAlunos}
                    onTouchDrop={handleDrop}
                  />
                )}
              </Box>
            </TouchDragProvider>
          </>
        )}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}
