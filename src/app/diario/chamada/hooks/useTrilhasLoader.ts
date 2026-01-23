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

      // Buscar alunos do Ensino Medio
      const alunos = await alunoService.getEnsinoMedio();
      const alunosAtivos = alunos.filter(a => turmasMap.has(a.turmaId));

      // Buscar chamadas existentes para a data
      const data = new Date(dataChamada + 'T12:00:00');
      const chamadas = await chamadaTrilhaService.getByData(data, ano);
      const chamadasMap = new Map(chamadas.map(c => [`${c.areaConhecimentoId}_${c.serie}`, c]));

      // Agrupar alunos por area e serie
      const areasData: AreaData[] = AREAS_CONHECIMENTO.map(area => {
        const series: SerieData[] = SERIES_ENSINO_MEDIO.map(serie => {
          // Filtrar alunos desta area e serie
          const alunosSerie = alunosAtivos
            .filter(aluno => {
              const turma = turmasMap.get(aluno.turmaId);
              if (!turma) return false;
              // Verificar se aluno pertence a esta serie
              const alunoSerie = turma.serie;
              const serieMatch = alunoSerie === serie.replace('ª ', 'a '); // "1ª Série" -> "1a Série"
              // Verificar area (se aluno tem areaConhecimentoId definido)
              const areaMatch = !aluno.areaConhecimentoId || aluno.areaConhecimentoId === area.id;
              return serieMatch && areaMatch;
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
