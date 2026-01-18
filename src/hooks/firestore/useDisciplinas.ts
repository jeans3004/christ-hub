'use client';

/**
 * Hook para gerenciar disciplinas.
 */

import { useState, useEffect, useCallback } from 'react';
import { disciplinaService } from '@/services/firestore';
import { Disciplina } from '@/types';

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
