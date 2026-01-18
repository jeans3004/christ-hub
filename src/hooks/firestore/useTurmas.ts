'use client';

/**
 * Hook para gerenciar turmas.
 */

import { useState, useEffect, useCallback } from 'react';
import { turmaService } from '@/services/firestore';
import { Turma } from '@/types';

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
