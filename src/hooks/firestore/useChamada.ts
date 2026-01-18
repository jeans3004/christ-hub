'use client';

/**
 * Hook para gerenciar chamada.
 */

import { useState, useEffect, useCallback } from 'react';
import { chamadaService } from '@/services/firestore';
import { Chamada } from '@/types';

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
