'use client';

/**
 * Pagina de conceitos - gerencia rubricas e avaliacoes de alunos.
 */

import { useState, useEffect } from 'react';
import { Box, Paper, Tabs, Tab } from '@mui/material';
import { Assignment, Grading } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useFilterStore } from '@/store/filterStore';
import {
  useTurmas,
  useDisciplinas,
  useAlunosByTurma,
  useRubricas,
  useAvaliacoesRubricas,
} from '@/hooks/useFirestoreData';
import { RubricasTab, AvaliacaoTab } from './components';

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

export default function ConceitosPage() {
  const { ano, setAno, serieId, setSerieId, disciplinaId, setDisciplinaId } = useFilterStore();
  const [tabValue, setTabValue] = useState(0);
  const [bimestre, setBimestre] = useState(1);

  // Hooks de dados
  const { turmas, loading: loadingTurmas } = useTurmas(ano);
  const { disciplinas: todasDisciplinas, loading: loadingDisciplinas } = useDisciplinas();
  const { alunos, loading: loadingAlunos } = useAlunosByTurma(serieId || null);
  const { rubricas, loading: loadingRubricas, refetch: refetchRubricas } = useRubricas();
  const { avaliacoes, loading: loadingAvaliacoes, saveAvaliacao } = useAvaliacoesRubricas(
    serieId || null,
    bimestre,
    ano
  );

  // Limpar disciplinaId quando turma muda
  useEffect(() => {
    if (serieId && disciplinaId) {
      const disciplinaValida = todasDisciplinas.find(
        (d) => d.id === disciplinaId && d.turmaIds?.includes(serieId)
      );
      if (!disciplinaValida) {
        setDisciplinaId('');
      }
    }
  }, [serieId, todasDisciplinas, disciplinaId, setDisciplinaId]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <MainLayout title="Conceitos">
      <Paper sx={{ p: 2, mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<Assignment />} iconPosition="start" label="Rubricas" />
          <Tab icon={<Grading />} iconPosition="start" label="Avaliar Alunos" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <RubricasTab
          rubricas={rubricas}
          loading={loadingRubricas}
          onRefresh={refetchRubricas}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <AvaliacaoTab
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
          avaliacoes={avaliacoes}
          loading={loadingAlunos || loadingAvaliacoes}
          onSaveAvaliacao={saveAvaliacao}
        />
      </TabPanel>
    </MainLayout>
  );
}
