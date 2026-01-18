'use client';

/**
 * Hook para carregar dados do dossie.
 */

import { useState, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { turmaService, alunoService, rubricaService, disciplinaService } from '@/services/firestore';
import { Turma, Aluno, Rubrica, Disciplina } from '@/types';

interface UseDossieLoaderReturn {
  turmas: Turma[];
  alunos: Aluno[];
  rubricas: Rubrica[];
  disciplinas: Disciplina[];
  loadingTurmas: boolean;
  loadingAlunos: boolean;
  canEdit: boolean;
}

export function useDossieLoader(ano: number, turmaId: string): UseDossieLoaderReturn {
  const { addToast } = useUIStore();
  const { isCoordinatorOrAbove, turmaIds } = usePermissions();

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [rubricas, setRubricas] = useState<Rubrica[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [loadingAlunos, setLoadingAlunos] = useState(false);

  const canEdit = isCoordinatorOrAbove();

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
        if (isMounted) setTurmas(turmasData);
      } catch (error) {
        if (isMounted) {
          addToast('Erro ao carregar turmas', 'error');
          console.error(error);
        }
      } finally {
        if (isMounted) setLoadingTurmas(false);
      }
    };
    loadTurmas();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano]);

  // Carregar dados auxiliares
  useEffect(() => {
    const loadAuxData = async () => {
      try {
        const [rubricasData, disciplinasData] = await Promise.all([
          rubricaService.getAll(),
          disciplinaService.getAll(),
        ]);
        setRubricas(rubricasData);
        setDisciplinas(disciplinasData);
      } catch (error) {
        console.error('Erro ao carregar dados auxiliares:', error);
      }
    };
    loadAuxData();
  }, []);

  // Carregar alunos
  useEffect(() => {
    const loadAlunos = async () => {
      if (!turmaId) {
        setAlunos([]);
        return;
      }
      setLoadingAlunos(true);
      try {
        const alunosData = await alunoService.getByTurma(turmaId);
        setAlunos(alunosData);
      } catch (error) {
        addToast('Erro ao carregar alunos', 'error');
        console.error(error);
      } finally {
        setLoadingAlunos(false);
      }
    };
    loadAlunos();
  }, [turmaId, addToast]);

  return { turmas, alunos, rubricas, disciplinas, loadingTurmas, loadingAlunos, canEdit };
}
