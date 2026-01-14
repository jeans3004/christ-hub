'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  turmaService,
  disciplinaService,
  alunoService,
  chamadaService,
  notaService,
  rubricaService,
  avaliacaoRubricaService,
} from '@/services/firestore';
import { Turma, Disciplina, Aluno, Chamada, Rubrica, AvaliacaoRubrica, NivelRubrica } from '@/types';

// Hook for Turmas
export function useTurmas(ano?: number) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTurmas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = ano
        ? await turmaService.getByAno(ano)
        : await turmaService.getAll();
      setTurmas(data);
    } catch (err) {
      setError('Erro ao carregar turmas');
      console.error('Error fetching turmas:', err);
    } finally {
      setLoading(false);
    }
  }, [ano]);

  useEffect(() => {
    fetchTurmas();
  }, [fetchTurmas]);

  return { turmas, loading, error, refetch: fetchTurmas };
}

// Hook for Disciplinas
export function useDisciplinas() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisciplinas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await disciplinaService.getAtivas();
      setDisciplinas(data);
    } catch (err) {
      setError('Erro ao carregar disciplinas');
      console.error('Error fetching disciplinas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisciplinas();
  }, [fetchDisciplinas]);

  return { disciplinas, loading, error, refetch: fetchDisciplinas };
}

// Hook for Alunos by Turma
export function useAlunosByTurma(turmaId: string | null) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlunos = useCallback(async () => {
    if (!turmaId) {
      setAlunos([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await alunoService.getByTurma(turmaId);
      setAlunos(data);
    } catch (err) {
      setError('Erro ao carregar alunos');
      console.error('Error fetching alunos:', err);
    } finally {
      setLoading(false);
    }
  }, [turmaId]);

  useEffect(() => {
    fetchAlunos();
  }, [fetchAlunos]);

  return { alunos, loading, error, refetch: fetchAlunos };
}

// Hook for Chamada
export function useChamada(turmaId: string | null, disciplinaId: string | null, data: Date | null) {
  const [chamada, setChamada] = useState<Chamada | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChamada = useCallback(async () => {
    if (!turmaId || !disciplinaId || !data) {
      setChamada(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const chamadas = await chamadaService.getByTurmaData(turmaId, data);
      const found = chamadas.find(c => c.disciplinaId === disciplinaId);
      setChamada(found || null);
    } catch (err) {
      setError('Erro ao carregar chamada');
      console.error('Error fetching chamada:', err);
    } finally {
      setLoading(false);
    }
  }, [turmaId, disciplinaId, data]);

  useEffect(() => {
    fetchChamada();
  }, [fetchChamada]);

  const saveChamada = async (chamadaData: Omit<Chamada, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (chamada?.id) {
        await chamadaService.update(chamada.id, chamadaData);
      } else {
        await chamadaService.create(chamadaData);
      }
      await fetchChamada();
      return true;
    } catch (err) {
      console.error('Error saving chamada:', err);
      return false;
    }
  };

  return { chamada, loading, error, refetch: fetchChamada, saveChamada };
}

// Interface for notas by aluno
interface AlunoNotas {
  alunoId: string;
  av1: number | null;
  rp1: number | null;
  av2: number | null;
  rp2: number | null;
}

// Hook for Notas by Turma, Disciplina and Bimestre
export function useNotas(
  turmaId: string | null,
  disciplinaId: string | null,
  bimestre: number,
  ano: number,
  alunoIds: string[]
) {
  const [notas, setNotas] = useState<Record<string, AlunoNotas>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotas = useCallback(async () => {
    if (!turmaId || !disciplinaId || alunoIds.length === 0) {
      setNotas({});
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const notasMap: Record<string, AlunoNotas> = {};

      // Initialize with empty notas for all alunos
      alunoIds.forEach(id => {
        notasMap[id] = { alunoId: id, av1: null, rp1: null, av2: null, rp2: null };
      });

      // Fetch notas for each aluno
      for (const alunoId of alunoIds) {
        const alunoNotas = await notaService.getByAlunoTurmaDisciplina(
          alunoId,
          turmaId,
          disciplinaId,
          ano
        );

        // Filter by bimestre and populate
        alunoNotas
          .filter(n => n.bimestre === bimestre)
          .forEach(nota => {
            if (nota.tipo === 'AV1') notasMap[alunoId].av1 = nota.valor;
            if (nota.tipo === 'AV2') notasMap[alunoId].av2 = nota.valor;
            // RP1 and RP2 are stored as REC type with additional info
          });
      }

      setNotas(notasMap);
    } catch (err) {
      setError('Erro ao carregar notas');
      console.error('Error fetching notas:', err);
    } finally {
      setLoading(false);
    }
  }, [turmaId, disciplinaId, bimestre, ano, alunoIds]);

  useEffect(() => {
    fetchNotas();
  }, [fetchNotas]);

  const saveNota = async (
    alunoId: string,
    tipo: 'AV1' | 'AV2' | 'REC',
    valor: number
  ) => {
    if (!turmaId || !disciplinaId) return false;

    try {
      // Check if nota already exists
      const existingNotas = await notaService.getByAlunoTurmaDisciplina(
        alunoId,
        turmaId,
        disciplinaId,
        ano
      );

      const existingNota = existingNotas.find(
        n => n.bimestre === bimestre && n.tipo === tipo
      );

      if (existingNota) {
        await notaService.update(existingNota.id, { valor });
      } else {
        await notaService.create({
          alunoId,
          turmaId,
          disciplinaId,
          professorId: '', // TODO: get from auth
          bimestre: bimestre as 1 | 2 | 3 | 4,
          tipo,
          valor,
          ano,
        });
      }

      await fetchNotas();
      return true;
    } catch (err) {
      console.error('Error saving nota:', err);
      return false;
    }
  };

  return { notas, loading, error, refetch: fetchNotas, saveNota };
}

// Hook for Rubricas
export function useRubricas(includeInactive = false) {
  const [rubricas, setRubricas] = useState<Rubrica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRubricas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = includeInactive
        ? await rubricaService.getAllIncludingInactive()
        : await rubricaService.getAll();
      setRubricas(data);
    } catch (err) {
      setError('Erro ao carregar rubricas');
      console.error('Error fetching rubricas:', err);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchRubricas();
  }, [fetchRubricas]);

  return { rubricas, loading, error, refetch: fetchRubricas };
}

// Hook for Avaliacoes de Rubricas
export function useAvaliacoesRubricas(
  turmaId: string | null,
  bimestre: number,
  ano: number
) {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoRubrica[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvaliacoes = useCallback(async () => {
    if (!turmaId) {
      setAvaliacoes([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await avaliacaoRubricaService.getByTurmaBimestre(turmaId, bimestre, ano);
      setAvaliacoes(data);
    } catch (err) {
      setError('Erro ao carregar avaliações');
      console.error('Error fetching avaliacoes:', err);
    } finally {
      setLoading(false);
    }
  }, [turmaId, bimestre, ano]);

  useEffect(() => {
    fetchAvaliacoes();
  }, [fetchAvaliacoes]);

  const saveAvaliacao = async (
    alunoId: string,
    rubricaId: string,
    disciplinaId: string,
    professorId: string,
    nivel: NivelRubrica,
    observacao?: string
  ) => {
    if (!turmaId) return false;

    try {
      // Check if avaliacao already exists
      const existing = avaliacoes.find(
        a => a.alunoId === alunoId && a.rubricaId === rubricaId
      );

      if (existing) {
        await avaliacaoRubricaService.update(existing.id, { nivel, observacao });
      } else {
        await avaliacaoRubricaService.create({
          alunoId,
          turmaId,
          disciplinaId,
          rubricaId,
          professorId,
          bimestre,
          ano,
          nivel,
          observacao,
        });
      }

      await fetchAvaliacoes();
      return true;
    } catch (err) {
      console.error('Error saving avaliacao:', err);
      return false;
    }
  };

  return { avaliacoes, loading, error, refetch: fetchAvaliacoes, saveAvaliacao };
}
