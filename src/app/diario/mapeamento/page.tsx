'use client';

/**
 * Pagina de mapeamento de sala.
 */

import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Snackbar, Alert, CircularProgress, Button, Tooltip } from '@mui/material';
import { Shuffle, ClearAll } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useAuthStore } from '@/store/authStore';
import { useMapeamentoData } from './hooks';
import { MapeamentoFilters, ClassroomGrid, StudentList, ModoToolbar, ModoInstrucoes, TouchDragProvider, ProfessorTabs } from './components';
import { ModoEdicao } from './types';

export default function MapeamentoPage() {
  const { usuario } = useAuthStore();
  const {
    ano, setAno, turmaId, setTurmaId, turmas, alunos,
    disciplinaId, setDisciplinaId, disciplinas,
    loadingTurmas, loadingDisciplinas, loadingAlunos, loadingMapeamento,
    alunosDisponiveis, layout, celulas, modoEdicao, setModoEdicao,
    atualizarLayout, alternarTipoCelula, atribuirAluno, saving, salvar, resetar,
    distribuirAleatorio, limparTodos,
    mapeamentosDaTurma, professorIdVisualizando, setProfessorIdVisualizando, conselheiroId,
  } = useMapeamentoData();

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const loading = loadingAlunos || loadingMapeamento;
  const isVisualizando = !!professorIdVisualizando;

  // Definir visualização padrão do conselheiro se existir e o usuário ainda não tiver mapeamento
  useEffect(() => {
    if (turmaId && conselheiroId && mapeamentosDaTurma.length > 0 && usuario) {
      // Se o usuário não tem mapeamento próprio e existe mapeamento do conselheiro, mostrar o do conselheiro
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

  const mapModoEdicao = (modo: ModoEdicao): ModoEdicao => {
    if (modo === 'selecionar') return 'atribuir';
    if (modo === 'remover') return 'remover_aluno';
    return modo;
  };

  return (
    <MainLayout>
      <Box sx={{ px: 1, py: 1 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 1.5 }}>Mapeamento de Sala</Typography>

        <MapeamentoFilters
          ano={ano} setAno={setAno} turmaId={turmaId} setTurmaId={setTurmaId}
          turmas={turmas} loadingTurmas={loadingTurmas}
          disciplinaId={disciplinaId} setDisciplinaId={setDisciplinaId}
          disciplinas={disciplinas} loadingDisciplinas={loadingDisciplinas}
        />

        {!turmaId ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">Selecione uma turma para visualizar ou criar o mapeamento</Typography>
          </Box>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            {mapeamentosDaTurma.length > 0 && usuario && (
              <ProfessorTabs
                mapeamentos={mapeamentosDaTurma}
                professorIdVisualizando={professorIdVisualizando}
                onProfessorChange={setProfessorIdVisualizando}
                conselheiroId={conselheiroId}
                usuarioId={usuario.id}
              />
            )}

            {!isVisualizando && (
              <ModoToolbar
                modoEdicao={modoEdicao} setModoEdicao={setModoEdicao}
                saving={saving} onSave={handleSave} onResetar={resetar}
              />
            )}
            {!isVisualizando && (
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Tooltip title="Distribuir alunos aleatoriamente nas mesas disponíveis">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Shuffle />}
                    onClick={distribuirAleatorio}
                    disabled={alunos.length === 0}
                  >
                    Distribuir Aleatório
                  </Button>
                </Tooltip>
                <Tooltip title="Remover todos os alunos das mesas">
                  <Button
                    variant="outlined"
                    size="small"
                    color="warning"
                    startIcon={<ClearAll />}
                    onClick={limparTodos}
                    disabled={!celulas.some(c => c.alunoId)}
                  >
                    Limpar Todos
                  </Button>
                </Tooltip>
              </Box>
            )}
            {!isVisualizando && <ModoInstrucoes modoEdicao={modoEdicao} />}

            <TouchDragProvider>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1 }}>
                  <ClassroomGrid
                    layout={layout} celulas={celulas}
                    modoEdicao={isVisualizando ? 'visualizar' : mapModoEdicao(modoEdicao)}
                    selectedCell={null}
                    onCelulaClick={isVisualizando ? () => {} : handleCelulaClick}
                    onDrop={isVisualizando ? () => {} : handleDrop}
                    onLayoutChange={isVisualizando ? () => {} : atualizarLayout}
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

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}
