/**
 * Hook para carregar dados do mapeamento.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { turmaService, alunoService, mapeamentoSalaService } from '@/services/firestore';
import { Aluno, Turma, LayoutSala } from '@/types';
import { CelulaMapa, DEFAULT_LAYOUT, getIniciais, gerarLayoutInicial } from '../types';

interface UseMapeamentoLoaderReturn {
  turmas: Turma[];
  alunos: Aluno[];
  loadingTurmas: boolean;
  loadingAlunos: boolean;
  loadingMapeamento: boolean;
  layout: LayoutSala;
  celulas: CelulaMapa[];
  setLayout: (layout: LayoutSala) => void;
  setCelulas: React.Dispatch<React.SetStateAction<CelulaMapa[]>>;
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
}

export function useMapeamentoLoader(ano: number, turmaId: string): UseMapeamentoLoaderReturn {
  const { usuario } = useAuthStore();
  const { addToast } = useUIStore();
  const { isCoordinatorOrAbove, turmaIds } = usePermissions();

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [loadingMapeamento, setLoadingMapeamento] = useState(false);
  const [layout, setLayout] = useState<LayoutSala>(DEFAULT_LAYOUT);
  const [celulas, setCelulas] = useState<CelulaMapa[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Carregar turmas
  useEffect(() => {
    let isMounted = true;

    const loadTurmas = async () => {
      setLoadingTurmas(true);
      try {
        let turmasData = await turmaService.getByAno(ano);

        if (!isCoordinatorOrAbove() && turmaIds.length > 0) {
          turmasData = turmasData.filter((t) => turmaIds.includes(t.id));
        }

        if (isMounted) {
          setTurmas(turmasData);
        }
      } catch (error) {
        if (isMounted) {
          addToast('Erro ao carregar turmas', 'error');
        }
      } finally {
        if (isMounted) {
          setLoadingTurmas(false);
        }
      }
    };

    loadTurmas();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano]);

  // Carregar alunos e mapeamento existente
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!turmaId || !usuario) {
        setAlunos([]);
        setCelulas(gerarLayoutInicial(DEFAULT_LAYOUT));
        setLayout(DEFAULT_LAYOUT);
        setIsDirty(false);
        return;
      }

      setLoadingAlunos(true);
      setLoadingMapeamento(true);

      try {
        const [alunosData, mapeamento] = await Promise.all([
          alunoService.getByTurma(turmaId),
          mapeamentoSalaService.getByTurmaProfessorAno(turmaId, usuario.id, ano),
        ]);

        if (!isMounted) return;

        setAlunos(alunosData);

        if (mapeamento) {
          setLayout(mapeamento.layout);
          const celulasEnriquecidas: CelulaMapa[] = mapeamento.assentos.map((assento) => {
            const aluno = alunosData.find((a) => a.id === assento.alunoId);
            return {
              ...assento,
              aluno: aluno ? {
                id: aluno.id,
                nome: aluno.nome,
                fotoUrl: aluno.fotoUrl,
                iniciais: getIniciais(aluno.nome),
              } : undefined,
            };
          });
          setCelulas(celulasEnriquecidas);
        } else {
          setLayout(DEFAULT_LAYOUT);
          setCelulas(gerarLayoutInicial(DEFAULT_LAYOUT));
        }

        setIsDirty(false);
      } catch (error) {
        if (isMounted) {
          addToast('Erro ao carregar dados', 'error');
          console.error(error);
        }
      } finally {
        if (isMounted) {
          setLoadingAlunos(false);
          setLoadingMapeamento(false);
        }
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [turmaId, ano, usuario, addToast]);

  return {
    turmas,
    alunos,
    loadingTurmas,
    loadingAlunos,
    loadingMapeamento,
    layout,
    celulas,
    setLayout,
    setCelulas,
    isDirty,
    setIsDirty,
  };
}
