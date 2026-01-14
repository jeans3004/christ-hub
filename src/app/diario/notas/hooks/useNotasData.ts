/**
 * Hook para gerenciamento de dados de notas.
 */

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { notaService } from '@/services/firestore';
import { Aluno } from '@/types';
import { NotasAluno, ModoCell, getCellKey } from '../types';

interface UseNotasDataParams {
  serieId: string;
  disciplinaId: string;
  bimestre: number;
  ano: number;
  alunos: Aluno[];
}

interface UseNotasDataReturn {
  notas: Record<string, NotasAluno>;
  setNotas: React.Dispatch<React.SetStateAction<Record<string, NotasAluno>>>;
  modosCells: Record<string, ModoCell>;
  setModosCells: React.Dispatch<React.SetStateAction<Record<string, ModoCell>>>;
  loading: boolean;
  saving: boolean;
  loadNotas: () => Promise<void>;
  getModoCell: (alunoId: string, av: 'av1' | 'av2') => ModoCell;
  handleNotaChange: (alunoId: string, tipo: 'av1' | 'av2' | 'rp1' | 'rp2', valor: string) => void;
  calcularMedia: (alunoId: string) => string;
}

export function useNotasData({
  serieId,
  disciplinaId,
  bimestre,
  ano,
  alunos,
}: UseNotasDataParams): UseNotasDataReturn {
  const { addToast } = useUIStore();
  const [notas, setNotas] = useState<Record<string, NotasAluno>>({});
  const [modosCells, setModosCells] = useState<Record<string, ModoCell>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadNotas = useCallback(async () => {
    if (!serieId || !disciplinaId || alunos.length === 0) {
      setNotas({});
      setModosCells({});
      return;
    }

    setLoading(true);
    try {
      const notasMap: Record<string, NotasAluno> = {};
      const modosMap: Record<string, ModoCell> = {};

      // Inicializar com notas vazias para todos os alunos
      alunos.forEach(aluno => {
        notasMap[aluno.id] = { av1: null, rp1: null, av2: null, rp2: null };
      });

      // Buscar notas de cada aluno
      for (const aluno of alunos) {
        const alunoNotas = await notaService.getByAlunoTurmaDisciplina(
          aluno.id,
          serieId,
          disciplinaId,
          ano
        );

        // Filtrar por bimestre e popular
        alunoNotas
          .filter(n => n.bimestre === bimestre)
          .forEach(nota => {
            if (nota.tipo === 'AV1') {
              notasMap[aluno.id].av1 = nota.valor;
              notasMap[aluno.id].av1Id = nota.id;
              notasMap[aluno.id].av1Composicao = nota.composicao;
              if (nota.composicao && nota.composicao.length > 0) {
                modosMap[getCellKey(aluno.id, 'av1')] = {
                  modo: 'composicao',
                  composicao: nota.composicao,
                };
              }
            }
            if (nota.tipo === 'AV2') {
              notasMap[aluno.id].av2 = nota.valor;
              notasMap[aluno.id].av2Id = nota.id;
              notasMap[aluno.id].av2Composicao = nota.composicao;
              if (nota.composicao && nota.composicao.length > 0) {
                modosMap[getCellKey(aluno.id, 'av2')] = {
                  modo: 'composicao',
                  composicao: nota.composicao,
                };
              }
            }
            if (nota.tipo === 'REC') {
              if (notasMap[aluno.id].rp1 === null) {
                notasMap[aluno.id].rp1 = nota.valor;
                notasMap[aluno.id].rp1Id = nota.id;
              } else {
                notasMap[aluno.id].rp2 = nota.valor;
                notasMap[aluno.id].rp2Id = nota.id;
              }
            }
          });
      }

      setNotas(notasMap);
      setModosCells(modosMap);
    } catch (error) {
      console.error('Error loading notas:', error);
      addToast('Erro ao carregar notas', 'error');
    } finally {
      setLoading(false);
    }
  }, [serieId, disciplinaId, bimestre, ano, alunos, addToast]);

  // Carregar notas quando filtros mudam
  useEffect(() => {
    loadNotas();
  }, [loadNotas]);

  const getModoCell = useCallback((alunoId: string, av: 'av1' | 'av2'): ModoCell => {
    const key = getCellKey(alunoId, av);
    return modosCells[key] || { modo: 'bloqueado' };
  }, [modosCells]);

  const handleNotaChange = useCallback((
    alunoId: string,
    tipo: 'av1' | 'av2' | 'rp1' | 'rp2',
    valor: string
  ) => {
    const numValue = valor === '' ? null : parseFloat(valor.replace(',', '.'));
    if (numValue !== null && (numValue < 0 || numValue > 10)) return;

    setNotas(prev => ({
      ...prev,
      [alunoId]: {
        ...prev[alunoId],
        [tipo]: numValue,
      },
    }));
  }, []);

  const calcularMedia = useCallback((alunoId: string): string => {
    const alunoNotas = notas[alunoId];
    if (!alunoNotas) return '-';

    const { av1, rp1, av2, rp2 } = alunoNotas;

    const notaAv1 = av1 !== null ? (rp1 !== null && rp1 > av1 ? rp1 : av1) : (rp1 ?? null);
    const notaAv2 = av2 !== null ? (rp2 !== null && rp2 > av2 ? rp2 : av2) : (rp2 ?? null);

    const valores = [notaAv1, notaAv2].filter(v => v !== null) as number[];

    if (valores.length === 0) return '-';

    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    return media.toFixed(1);
  }, [notas]);

  return {
    notas,
    setNotas,
    modosCells,
    setModosCells,
    loading,
    saving,
    loadNotas,
    getModoCell,
    handleNotaChange,
    calcularMedia,
  };
}
