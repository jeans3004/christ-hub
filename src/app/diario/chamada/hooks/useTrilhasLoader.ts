/**
 * Hook para carregamento de dados de Trilhas.
 */

import { useState, useEffect, useCallback } from 'react';
import { Aluno, ChamadaTrilha, Turma, SerieEnsinoMedioTrilha } from '@/types';
import { alunoService, turmaService, chamadaTrilhaService } from '@/services/firestore';
import { AREAS_CONHECIMENTO, SERIES_ENSINO_MEDIO, AreaConhecimentoId } from '@/constants';

export interface AlunoTrilha extends Aluno {
  turmaNome: string;
}

export interface SerieData {
  serie: SerieEnsinoMedioTrilha;
  alunos: AlunoTrilha[];
  chamada: ChamadaTrilha | null;
}

export interface AreaData {
  id: AreaConhecimentoId;
  nome: string;
  cor: string;
  sigla: string;
  series: SerieData[];
}

interface UseTrilhasLoaderParams {
  ano: number;
  dataChamada: string;
}

interface UseTrilhasLoaderReturn {
  areasDados: AreaData[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useTrilhasLoader({ ano, dataChamada }: UseTrilhasLoaderParams): UseTrilhasLoaderReturn {
  const [areasDados, setAreasDados] = useState<AreaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!ano || !dataChamada) return;

    setLoading(true);
    setError(null);

    try {
      // Buscar turmas do Ensino Medio para o ano
      const turmas = await turmaService.getByAno(ano);
      const turmasEM = turmas.filter(t => t.ensino === 'Ensino Médio' && t.ativo);
      const turmasMap = new Map(turmasEM.map(t => [t.id, t]));
      const turmaIds = Array.from(turmasMap.keys());

      // Buscar alunos de todas as turmas do Ensino Medio
      const alunosPromises = turmaIds.map(turmaId => alunoService.getByTurma(turmaId));
      const alunosArrays = await Promise.all(alunosPromises);
      const alunosAtivos = alunosArrays.flat();

      // Buscar chamadas existentes para a data
      const data = new Date(dataChamada + 'T12:00:00');
      const chamadas = await chamadaTrilhaService.getByData(data, ano);
      const chamadasMap = new Map(chamadas.map(c => [`${c.areaConhecimentoId}_${c.serie}`, c]));

      // Agrupar alunos por area e serie
      const areasData: AreaData[] = AREAS_CONHECIMENTO.map(area => {
        const series: SerieData[] = SERIES_ENSINO_MEDIO.map(serie => {
          // Filtrar alunos desta area e serie
          // Apenas alunos que foram ATRIBUIDOS a esta area especifica
          const alunosSerie = alunosAtivos
            .filter(aluno => {
              const turma = turmasMap.get(aluno.turmaId);
              if (!turma) return false;
              // Verificar se aluno foi atribuido a esta area
              if (aluno.areaConhecimentoId !== area.id) return false;
              // Verificar se aluno pertence a esta serie
              const normalizar = (s: string) => s.toLowerCase().replace(/[ªºa]/g, '').replace(/\s+/g, ' ').trim();
              const serieMatch = normalizar(turma.serie) === normalizar(serie);
              return serieMatch;
            })
            .map(aluno => ({
              ...aluno,
              turmaNome: turmasMap.get(aluno.turmaId)?.nome || aluno.turma || '',
            }))
            .sort((a, b) => a.nome.localeCompare(b.nome));

          const chamada = chamadasMap.get(`${area.id}_${serie}`) || null;

          return { serie, alunos: alunosSerie, chamada };
        });

        return {
          id: area.id as AreaConhecimentoId,
          nome: area.nome,
          cor: area.cor,
          sigla: area.sigla,
          series,
        };
      });

      setAreasDados(areasData);
    } catch (err) {
      console.error('Erro ao carregar dados de trilhas:', err);
      setError('Erro ao carregar dados de trilhas');
    } finally {
      setLoading(false);
    }
  }, [ano, dataChamada]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    areasDados,
    loading,
    error,
    reload: loadData,
  };
}
