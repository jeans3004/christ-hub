'use client';

/**
 * Hook para gerenciar rubricas.
 */

import { useState, useEffect, useCallback } from 'react';
import { rubricaService } from '@/services/firestore';
import { Rubrica } from '@/types';

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
