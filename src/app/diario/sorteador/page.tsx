'use client';

import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Paper, Alert, CircularProgress, Snackbar } from '@mui/material';
import { Casino } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { usePermissions } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import { useTurmas } from '@/hooks/firestore/useTurmas';
import { useAlunosByTurma } from '@/hooks/firestore/useAlunosByTurma';
import { sorteioService } from '@/services/firestore';
import type { Sorteio } from '@/services/firestore/sorteioService';
import { DrawSettings, DrawResult, DrawHistory } from './components';
import type { ModoSorteio } from './components';

// --- Shuffle utility (Fisher-Yates) ---
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- Draw logic (pure functions) ---
function sortearIndividual(alunos: { id: string; nome: string }[]): Sorteio['resultado'] {
  const shuffled = shuffle(alunos);
  return { alunos: [shuffled[0]] };
}

function sortearMultiplo(alunos: { id: string; nome: string }[], quantidade: number): Sorteio['resultado'] {
  const shuffled = shuffle(alunos);
  return { alunos: shuffled.slice(0, quantidade) };
}

function formarEquipes(alunos: { id: string; nome: string }[], numEquipes: number): Sorteio['resultado'] {
  const shuffled = shuffle(alunos);
  const equipes: Sorteio['resultado']['equipes'] = [];
  for (let i = 0; i < numEquipes; i++) {
    equipes.push({ nome: `Equipe ${i + 1}`, membros: [] });
  }
  shuffled.forEach((aluno, index) => {
    equipes![index % numEquipes].membros.push(aluno);
  });
  return { equipes };
}

function sortearSequencia(alunos: { id: string; nome: string }[]): Sorteio['resultado'] {
  return { alunos: shuffle(alunos) };
}

export default function SorteadorPage() {
  const { can } = usePermissions();
  const { usuario } = useAuth();
  const { turmas, loading: loadingTurmas } = useTurmas();

  // State
  const [turmaId, setTurmaId] = useState('');
  const [modo, setModo] = useState<ModoSorteio>('individual');
  const [quantidade, setQuantidade] = useState(2);
  const [excluidos, setExcluidos] = useState<string[]>([]);
  const [resultado, setResultado] = useState<Sorteio['resultado'] | null>(null);
  const [historico, setHistorico] = useState<Sorteio[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { alunos, loading: loadingAlunos } = useAlunosByTurma(turmaId || null);

  // Load history when turma changes
  const carregarHistorico = useCallback(async () => {
    if (!turmaId) {
      setHistorico([]);
      return;
    }
    setLoadingHistorico(true);
    try {
      const data = await sorteioService.getByTurma(turmaId, 20);
      setHistorico(data);
    } catch (err) {
      console.error('Erro ao carregar historico:', err);
    } finally {
      setLoadingHistorico(false);
    }
  }, [turmaId]);

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  // Reset state on turma change
  const handleTurmaChange = useCallback((id: string) => {
    setTurmaId(id);
    setExcluidos([]);
    setResultado(null);
  }, []);

  // Execute draw
  const handleSortear = useCallback(() => {
    const alunosDisponiveis = alunos
      .filter((a) => !excluidos.includes(a.id))
      .map((a) => ({ id: a.id, nome: a.nome }));

    if (alunosDisponiveis.length === 0) return;

    let res: Sorteio['resultado'];
    switch (modo) {
      case 'individual':
        res = sortearIndividual(alunosDisponiveis);
        break;
      case 'multiplo':
        res = sortearMultiplo(alunosDisponiveis, Math.min(quantidade, alunosDisponiveis.length));
        break;
      case 'equipes':
        res = formarEquipes(alunosDisponiveis, Math.min(quantidade, Math.floor(alunosDisponiveis.length / 2) || 1));
        break;
      case 'sequencia':
        res = sortearSequencia(alunosDisponiveis);
        break;
    }
    setResultado(res);
  }, [alunos, excluidos, modo, quantidade]);

  // Save to Firestore
  const handleSalvar = useCallback(async () => {
    if (!resultado || !usuario || !turmaId) return;

    const turma = turmas.find((t) => t.id === turmaId);
    setSalvando(true);
    try {
      await sorteioService.create({
        turmaId,
        turmaNome: turma?.nome || '',
        modo,
        configuracao: {
          quantidade: modo === 'multiplo' || modo === 'equipes' ? quantidade : undefined,
          alunosExcluidos: excluidos.length > 0 ? excluidos : undefined,
        },
        resultado,
        totalAlunos: alunos.filter((a) => !excluidos.includes(a.id)).length,
        professorId: usuario.id,
        professorNome: usuario.nome,
      });
      setSnackbar({ open: true, message: 'Sorteio salvo com sucesso!', severity: 'success' });
      carregarHistorico();
    } catch (err) {
      console.error('Erro ao salvar sorteio:', err);
      setSnackbar({ open: true, message: 'Erro ao salvar sorteio', severity: 'error' });
    } finally {
      setSalvando(false);
    }
  }, [resultado, usuario, turmaId, turmas, modo, quantidade, excluidos, alunos, carregarHistorico]);

  // Delete from history
  const handleDelete = useCallback(async (id: string) => {
    try {
      await sorteioService.remove(id);
      setHistorico((prev) => prev.filter((s) => s.id !== id));
      setSnackbar({ open: true, message: 'Sorteio excluido', severity: 'success' });
    } catch (err) {
      console.error('Erro ao excluir sorteio:', err);
      setSnackbar({ open: true, message: 'Erro ao excluir sorteio', severity: 'error' });
    }
  }, []);

  const handleNovoSorteio = useCallback(() => {
    setResultado(null);
  }, []);

  // Permission check
  if (!can('sorteador:view')) {
    return (
      <MainLayout>
        <Alert severity="warning">Voce nao tem permissao para acessar o sorteador.</Alert>
      </MainLayout>
    );
  }

  if (loadingTurmas) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Casino color="primary" />
          Sorteador de Equipes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sorteie alunos, forme equipes ou gere sequencias aleatorias.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'flex-start',
        }}
      >
        {/* Sidebar - Settings */}
        <Paper
          sx={{
            p: 2,
            width: { xs: '100%', md: 280 },
            flexShrink: 0,
          }}
          variant="outlined"
        >
          <DrawSettings
            turmas={turmas}
            turmaId={turmaId}
            onTurmaChange={handleTurmaChange}
            alunos={alunos}
            loadingAlunos={loadingAlunos}
            modo={modo}
            onModoChange={setModo}
            quantidade={quantidade}
            onQuantidadeChange={setQuantidade}
            excluidos={excluidos}
            onExcluidosChange={setExcluidos}
            onSortear={handleSortear}
          />
        </Paper>

        {/* Main content - Result + History */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {resultado && (
            <Paper sx={{ p: 3 }} variant="outlined">
              <DrawResult
                resultado={resultado}
                modo={modo}
                onSalvar={handleSalvar}
                onNovoSorteio={handleNovoSorteio}
                salvando={salvando}
              />
            </Paper>
          )}

          {turmaId && (
            <Paper sx={{ p: 2 }} variant="outlined">
              <DrawHistory
                historico={historico}
                loading={loadingHistorico}
                onDelete={handleDelete}
              />
            </Paper>
          )}
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
}
