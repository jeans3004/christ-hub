'use client';

/**
 * Pagina de mapeamento de sala.
 */

import { useState, useCallback } from 'react';
import { Box, Typography, Snackbar, Alert, CircularProgress } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import { useMapeamentoData } from './hooks';
import { MapeamentoFilters, ClassroomGrid, StudentList, ModoToolbar, ModoInstrucoes } from './components';
import { ModoEdicao } from './types';

export default function MapeamentoPage() {
  const {
    ano, setAno, turmaId, setTurmaId, turmas, alunos,
    loadingTurmas, loadingAlunos, loadingMapeamento,
    alunosDisponiveis, layout, celulas, modoEdicao, setModoEdicao,
    atualizarLayout, alternarTipoCelula, atribuirAluno, saving, salvar, resetar,
  } = useMapeamentoData();

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const loading = loadingAlunos || loadingMapeamento;

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
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>Mapeamento de Sala</Typography>

        <MapeamentoFilters
          ano={ano} setAno={setAno} turmaId={turmaId} setTurmaId={setTurmaId}
          turmas={turmas} loadingTurmas={loadingTurmas}
        />

        {!turmaId ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">Selecione uma turma para visualizar ou criar o mapeamento</Typography>
          </Box>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            <ModoToolbar
              modoEdicao={modoEdicao} setModoEdicao={setModoEdicao}
              saving={saving} onSave={handleSave} onResetar={resetar}
            />
            <ModoInstrucoes modoEdicao={modoEdicao} />

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 400 }}>
                <ClassroomGrid
                  layout={layout} celulas={celulas} modoEdicao={mapModoEdicao(modoEdicao)}
                  selectedCell={null} onCelulaClick={handleCelulaClick}
                  onDrop={handleDrop} onLayoutChange={atualizarLayout}
                />
              </Box>
              {modoEdicao === 'selecionar' && (
                <StudentList alunosDisponiveis={alunosDisponiveis} totalAlunos={alunos.length} loading={loadingAlunos} />
              )}
            </Box>
          </>
        )}

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}
