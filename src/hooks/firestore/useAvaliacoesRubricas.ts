'use client';

/**
 * Hook para gerenciar avaliações de rubricas.
 */

import { useState, useEffect, useCallback } from 'react';
import { avaliacaoRubricaService } from '@/services/firestore';
import { AvaliacaoRubrica, NivelRubrica } from '@/types';

export function useAvaliacoesRubricas(
  turmaId: string | null,
  bimestre: number,
  ano: number,
  av?: 'av1' | 'av2'
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
      // Se av for especificado, busca apenas avaliações dessa AV
      const data = av
        ? await avaliacaoRubricaService.getByTurmaBimestreAv(turmaId, bimestre, ano, av)
        : await avaliacaoRubricaService.getByTurmaBimestre(turmaId, bimestre, ano);
      setAvaliacoes(data);
    } catch (err) {
      setError('Erro ao carregar avaliações');
      console.error('Error fetching avaliacoes:', err);
    } finally {
      setLoading(false);
    }
  }, [turmaId, bimestre, ano, av]);

  useEffect(() => {
    fetchAvaliacoes();
  }, [fetchAvaliacoes]);

  // Função de salvar com assinatura compatível com versão anterior (para conceitos)
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
      // Check if avaliacao already exists (verifica também disciplinaId e bimestre)
      const existing = avaliacoes.find(
        a => a.alunoId === alunoId &&
             a.rubricaId === rubricaId &&
             a.disciplinaId === disciplinaId &&
             a.bimestre === bimestre &&
             (!a.componenteId || a.componenteId === '')
      );

      if (existing) {
        const updateData: { nivel: NivelRubrica; observacao?: string } = { nivel };
        if (observacao !== undefined) {
          updateData.observacao = observacao;
        }
        await avaliacaoRubricaService.update(existing.id, updateData);
      } else {
        const createData: {
          alunoId: string;
          turmaId: string;
          disciplinaId: string;
          rubricaId: string;
          componenteId: string;
          av: 'av1' | 'av2';
          professorId: string;
          bimestre: number;
          ano: number;
          nivel: NivelRubrica;
          observacao?: string;
        } = {
          alunoId,
          turmaId,
          disciplinaId,
          rubricaId,
          componenteId: '', // Vazio para avaliações de conceito (não composição)
          av: av || 'av1', // Default para av1 se não especificado
          professorId,
          bimestre,
          ano,
          nivel,
        };
        if (observacao !== undefined) {
          createData.observacao = observacao;
        }
        await avaliacaoRubricaService.create(createData);
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
