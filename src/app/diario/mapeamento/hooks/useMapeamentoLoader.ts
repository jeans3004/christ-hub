/**
 * Hook para carregar dados do mapeamento.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { turmaService, alunoService, mapeamentoSalaService, disciplinaService, usuarioService } from '@/services/firestore';
import { Aluno, Turma, Disciplina, LayoutSala, MapeamentoSala } from '@/types';
import { CelulaMapa, DEFAULT_LAYOUT, getIniciais, gerarLayoutInicial } from '../types';
import { MapeamentoComProfessor } from './mapeamentoTypes';

interface UseMapeamentoLoaderReturn {
  turmas: Turma[];
  disciplinas: Disciplina[];
  alunos: Aluno[];
  loadingTurmas: boolean;
  loadingDisciplinas: boolean;
  loadingAlunos: boolean;
  loadingMapeamento: boolean;
  layout: LayoutSala;
  celulas: CelulaMapa[];
  setLayout: (layout: LayoutSala) => void;
  setCelulas: React.Dispatch<React.SetStateAction<CelulaMapa[]>>;
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
  // Novos campos para visualização de outros professores
  mapeamentosDaTurma: MapeamentoComProfessor[];
  conselheiroId: string | null;
}

export function useMapeamentoLoader(ano: number, turmaId: string, disciplinaId: string): UseMapeamentoLoaderReturn {
  const { usuario } = useAuthStore();
  const { addToast } = useUIStore();
  const { isCoordinatorOrAbove, turmaIds } = usePermissions();

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [loadingDisciplinas, setLoadingDisciplinas] = useState(false);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [loadingMapeamento, setLoadingMapeamento] = useState(false);
  const [layout, setLayout] = useState<LayoutSala>(DEFAULT_LAYOUT);
  const [celulas, setCelulas] = useState<CelulaMapa[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [mapeamentosDaTurma, setMapeamentosDaTurma] = useState<MapeamentoComProfessor[]>([]);
  const [conselheiroId, setConselheiroId] = useState<string | null>(null);

  // Carregar turmas e disciplinas
  useEffect(() => {
    let isMounted = true;

    const loadTurmasAndDisciplinas = async () => {
      setLoadingTurmas(true);
      setLoadingDisciplinas(true);
      try {
        const [turmasData, disciplinasData] = await Promise.all([
          turmaService.getByAno(ano),
          disciplinaService.getAll(),
        ]);

        let turmasFiltradas = turmasData;
        let disciplinasFiltradas = disciplinasData;

        if (!isCoordinatorOrAbove()) {
          if (turmaIds.length > 0) {
            turmasFiltradas = turmasData.filter((t) => turmaIds.includes(t.id));
          }
          // Filtrar disciplinas do professor se tiver disciplinaIds
          if (usuario?.disciplinaIds && usuario.disciplinaIds.length > 0) {
            disciplinasFiltradas = disciplinasData.filter((d) => usuario.disciplinaIds!.includes(d.id));
          }
        }

        if (isMounted) {
          setTurmas(turmasFiltradas);
          setDisciplinas(disciplinasFiltradas);
        }
      } catch (error) {
        if (isMounted) {
          addToast('Erro ao carregar turmas', 'error');
        }
      } finally {
        if (isMounted) {
          setLoadingTurmas(false);
          setLoadingDisciplinas(false);
        }
      }
    };

    loadTurmasAndDisciplinas();
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
        setMapeamentosDaTurma([]);
        setConselheiroId(null);
        return;
      }

      setLoadingAlunos(true);
      setLoadingMapeamento(true);

      try {
        // Buscar dados em paralelo
        const [alunosData, mapeamento, todosMapeamentos, turmaData] = await Promise.all([
          alunoService.getByTurma(turmaId),
          mapeamentoSalaService.getByTurmaProfessorDisciplinaAno(
            turmaId,
            usuario.id,
            ano,
            disciplinaId || undefined
          ),
          mapeamentoSalaService.getByTurmaAno(turmaId, ano),
          turmaService.get(turmaId),
        ]);

        if (!isMounted) return;

        setAlunos(alunosData);
        setConselheiroId(turmaData?.professorConselheiroId || null);

        // Enriquecer mapeamentos com nomes de professores
        const professoresIds = [...new Set(todosMapeamentos.map(m => m.professorId))];
        const professoresMap = new Map<string, string>();

        // Buscar nomes dos professores
        for (const profId of professoresIds) {
          try {
            const prof = await usuarioService.get(profId);
            if (prof) {
              professoresMap.set(profId, prof.nome);
            }
          } catch {
            // Ignora erro se professor não encontrado
          }
        }

        const mapeamentosEnriquecidos: MapeamentoComProfessor[] = todosMapeamentos.map(m => ({
          ...m,
          professorNome: professoresMap.get(m.professorId) || 'Professor desconhecido',
          isConselheiro: m.professorId === turmaData?.professorConselheiroId,
        }));

        setMapeamentosDaTurma(mapeamentosEnriquecidos);

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
  }, [turmaId, ano, disciplinaId, usuario, addToast]);

  return {
    turmas,
    disciplinas,
    alunos,
    loadingTurmas,
    loadingDisciplinas,
    loadingAlunos,
    loadingMapeamento,
    layout,
    celulas,
    setLayout,
    setCelulas,
    isDirty,
    setIsDirty,
    mapeamentosDaTurma,
    conselheiroId,
  };
}
