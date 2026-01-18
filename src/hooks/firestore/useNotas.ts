'use client';

/**
 * Hook para gerenciar notas por turma, disciplina e bimestre.
 */

import { useState, useEffect, useCallback } from 'react';
import { notaService } from '@/services/firestore';
import { AlunoNotas } from './types';

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
