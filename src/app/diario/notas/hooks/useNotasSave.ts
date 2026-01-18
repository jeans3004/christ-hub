/**
 * Hook para salvar notas.
 */

import { useState, useCallback } from 'react';
import { notaService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';
import type { Aluno } from '@/types';
import type { NotasAluno, ModoCell } from '../types';

interface UseNotasSaveParams {
  serieId: string;
  disciplinaId: string;
  bimestre: number;
  ano: number;
  alunos: Aluno[];
  notas: Record<string, NotasAluno>;
  getModoCell: (alunoId: string, av: 'av1' | 'av2') => ModoCell;
  usuarioId: string | undefined;
}

export function useNotasSave({
  serieId,
  disciplinaId,
  bimestre,
  ano,
  alunos,
  notas,
  getModoCell,
  usuarioId,
}: UseNotasSaveParams) {
  const { addToast } = useUIStore();
  const [saving, setSaving] = useState(false);

  const handleSaveNotas = useCallback(async () => {
    if (!serieId || !disciplinaId || !usuarioId) {
      addToast('Selecione turma e disciplina', 'error');
      return;
    }

    setSaving(true);
    try {
      for (const aluno of alunos) {
        const alunoNotas = notas[aluno.id];
        if (!alunoNotas) continue;

        await saveAvNota(alunoNotas, aluno.id, 'av1', getModoCell, {
          serieId, disciplinaId, bimestre, ano, usuarioId,
        });
        await saveAvNota(alunoNotas, aluno.id, 'av2', getModoCell, {
          serieId, disciplinaId, bimestre, ano, usuarioId,
        });
        await saveRecNota(alunoNotas, aluno.id, 'rp1', {
          serieId, disciplinaId, bimestre, ano, usuarioId,
        });
        await saveRecNota(alunoNotas, aluno.id, 'rp2', {
          serieId, disciplinaId, bimestre, ano, usuarioId,
        });
      }

      addToast('Notas salvas com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving notas:', error);
      addToast('Erro ao salvar notas', 'error');
    } finally {
      setSaving(false);
    }
  }, [serieId, disciplinaId, usuarioId, alunos, notas, bimestre, ano, getModoCell, addToast]);

  return { saving, handleSaveNotas };
}

/**
 * Salva nota AV1 ou AV2.
 */
async function saveAvNota(
  alunoNotas: NotasAluno,
  alunoId: string,
  av: 'av1' | 'av2',
  getModoCell: (alunoId: string, av: 'av1' | 'av2') => ModoCell,
  ctx: { serieId: string; disciplinaId: string; bimestre: number; ano: number; usuarioId: string }
) {
  const modo = getModoCell(alunoId, av);
  const valor = alunoNotas[av];
  const notaId = av === 'av1' ? alunoNotas.av1Id : alunoNotas.av2Id;

  if (modo.modo === 'bloqueado' || valor === null) return;

  const notaData: Record<string, unknown> = {
    alunoId,
    turmaId: ctx.serieId,
    disciplinaId: ctx.disciplinaId,
    professorId: ctx.usuarioId,
    bimestre: ctx.bimestre as 1 | 2 | 3 | 4,
    tipo: av.toUpperCase(),
    valor,
    ano: ctx.ano,
  };

  if (modo.composicao && modo.composicao.length > 0) {
    notaData.composicao = modo.composicao;
  }

  if (notaId) {
    await notaService.update(notaId, notaData);
  } else {
    await notaService.create(notaData as Parameters<typeof notaService.create>[0]);
  }
}

/**
 * Salva nota de recuperacao RP1 ou RP2.
 */
async function saveRecNota(
  alunoNotas: NotasAluno,
  alunoId: string,
  rp: 'rp1' | 'rp2',
  ctx: { serieId: string; disciplinaId: string; bimestre: number; ano: number; usuarioId: string }
) {
  const valor = alunoNotas[rp];
  const notaId = rp === 'rp1' ? alunoNotas.rp1Id : alunoNotas.rp2Id;

  if (valor === null) return;

  if (notaId) {
    await notaService.update(notaId, { valor });
  } else {
    await notaService.create({
      alunoId,
      turmaId: ctx.serieId,
      disciplinaId: ctx.disciplinaId,
      professorId: ctx.usuarioId,
      bimestre: ctx.bimestre as 1 | 2 | 3 | 4,
      tipo: 'REC',
      valor,
      ano: ctx.ano,
    });
  }
}
