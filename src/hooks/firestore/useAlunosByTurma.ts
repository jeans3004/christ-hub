'use client';

/**
 * Hook para buscar alunos por turma.
 */

import { useState, useEffect, useCallback } from 'react';
import { alunoService } from '@/services/firestore';
import { Aluno } from '@/types';

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
