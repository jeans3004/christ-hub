/**
 * Hook para acoes de Trilhas.
 */

import { useState, useCallback } from 'react';
import { SerieEnsinoMedioTrilha, PresencaAlunoTrilha } from '@/types';
import { chamadaTrilhaService, ChamadaTrilhaInput } from '@/services/firestore';
import { AreaConhecimentoId } from '@/constants';
import { useUIStore } from '@/store/uiStore';
import { AreaData, SerieData, AlunoTrilha } from './useTrilhasLoader';

// Estado local de uma serie (antes de salvar)
export interface SerieState {
  presencas: Record<string, boolean>; // alunoId -> presente
  conteudo: string;
  realizada: boolean;
  observacao: string;
  hasChanges: boolean;
}

// Estado de todas as areas/series
export type TrilhasState = Record<string, Record<string, SerieState>>; // areaId -> serie -> state

interface UseTrilhasActionsParams {
  areasDados: AreaData[];
  ano: number;
  dataChamada: string;
  professorId: string;
  professorNome: string;
}

interface UseTrilhasActionsReturn {
  trilhasState: TrilhasState;
  isSaving: boolean;
  hasAnyChanges: boolean;
  initializeState: () => void;
  atualizarPresenca: (areaId: string, serie: string, alunoId: string, presente: boolean) => void;
  marcarTodosPresentes: (areaId: string, serie: string, presente: boolean) => void;
  atualizarConteudo: (areaId: string, serie: string, conteudo: string) => void;
  marcarNaoRealizada: (areaId: string, serie: string, observacao: string) => void;
  marcarRealizada: (areaId: string, serie: string) => void;
  salvarTudo: () => Promise<void>;
}

function createInitialSerieState(serieData: SerieData): SerieState {
  const presencas: Record<string, boolean> = {};

  if (serieData.chamada && serieData.chamada.realizada) {
    // Carregar presencas da chamada existente
    serieData.chamada.presencas.forEach(p => {
      presencas[p.alunoId] = p.presente;
    });
    // Adicionar alunos novos (nao na chamada) como presentes
    serieData.alunos.forEach(a => {
      if (!(a.id in presencas)) {
        presencas[a.id] = true;
      }
    });
  } else {
    // Todos presentes por padrao
    serieData.alunos.forEach(a => {
      presencas[a.id] = true;
    });
  }

  return {
    presencas,
    conteudo: serieData.chamada?.conteudo || '',
    realizada: serieData.chamada?.realizada ?? true, // Default: realizada
    observacao: serieData.chamada?.observacao || '',
    hasChanges: false,
  };
}

export function useTrilhasActions({
  areasDados,
  ano,
  dataChamada,
  professorId,
  professorNome,
}: UseTrilhasActionsParams): UseTrilhasActionsReturn {
  const { addToast } = useUIStore();
  const [trilhasState, setTrilhasState] = useState<TrilhasState>({});
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar estado com dados carregados
  const initializeState = useCallback(() => {
    const newState: TrilhasState = {};
    areasDados.forEach(area => {
      newState[area.id] = {};
      area.series.forEach(serieData => {
        newState[area.id][serieData.serie] = createInitialSerieState(serieData);
      });
    });
    setTrilhasState(newState);
  }, [areasDados]);

  // Atualizar presenca de um aluno
  const atualizarPresenca = useCallback((areaId: string, serie: string, alunoId: string, presente: boolean) => {
    setTrilhasState(prev => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        [serie]: {
          ...prev[areaId]?.[serie],
          presencas: {
            ...prev[areaId]?.[serie]?.presencas,
            [alunoId]: presente,
          },
          realizada: true,
          hasChanges: true,
        },
      },
    }));
  }, []);

  // Marcar todos presentes ou ausentes
  const marcarTodosPresentes = useCallback((areaId: string, serie: string, presente: boolean) => {
    setTrilhasState(prev => {
      const currentPresencas = prev[areaId]?.[serie]?.presencas || {};
      const newPresencas: Record<string, boolean> = {};
      Object.keys(currentPresencas).forEach(alunoId => {
        newPresencas[alunoId] = presente;
      });
      return {
        ...prev,
        [areaId]: {
          ...prev[areaId],
          [serie]: {
            ...prev[areaId]?.[serie],
            presencas: newPresencas,
            realizada: true,
            hasChanges: true,
          },
        },
      };
    });
  }, []);

  // Atualizar conteudo
  const atualizarConteudo = useCallback((areaId: string, serie: string, conteudo: string) => {
    setTrilhasState(prev => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        [serie]: {
          ...prev[areaId]?.[serie],
          conteudo,
          hasChanges: true,
        },
      },
    }));
  }, []);

  // Marcar como nao realizada
  const marcarNaoRealizada = useCallback((areaId: string, serie: string, observacao: string) => {
    setTrilhasState(prev => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        [serie]: {
          ...prev[areaId]?.[serie],
          realizada: false,
          observacao,
          hasChanges: true,
        },
      },
    }));
  }, []);

  // Marcar como realizada
  const marcarRealizada = useCallback((areaId: string, serie: string) => {
    setTrilhasState(prev => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        [serie]: {
          ...prev[areaId]?.[serie],
          realizada: true,
          observacao: '',
          hasChanges: true,
        },
      },
    }));
  }, []);

  // Salvar tudo
  const salvarTudo = useCallback(async () => {
    setIsSaving(true);
    try {
      const data = new Date(dataChamada + 'T12:00:00');
      const inputs: ChamadaTrilhaInput[] = [];

      // Coletar todas as series com mudancas
      areasDados.forEach(area => {
        area.series.forEach(serieData => {
          const state = trilhasState[area.id]?.[serieData.serie];
          if (!state?.hasChanges) return;

          const presencas: PresencaAlunoTrilha[] = serieData.alunos.map(aluno => ({
            alunoId: aluno.id,
            alunoNome: aluno.nome,
            turmaId: aluno.turmaId,
            turmaNome: aluno.turmaNome,
            presente: state.presencas[aluno.id] ?? true,
          }));

          inputs.push({
            data,
            ano,
            areaConhecimentoId: area.id,
            serie: serieData.serie,
            professorId,
            professorNome,
            presencas: state.realizada ? presencas : [],
            conteudo: state.conteudo || undefined,
            realizada: state.realizada,
            observacao: state.observacao || undefined,
          });
        });
      });

      if (inputs.length === 0) {
        addToast('Nenhuma alteração para salvar', 'info');
        return;
      }

      await chamadaTrilhaService.upsertBatch(inputs);

      // Resetar hasChanges
      setTrilhasState(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(areaId => {
          Object.keys(newState[areaId]).forEach(serie => {
            newState[areaId][serie] = { ...newState[areaId][serie], hasChanges: false };
          });
        });
        return newState;
      });

      addToast(`${inputs.length} chamada(s) salva(s) com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao salvar chamadas:', error);
      addToast('Erro ao salvar chamadas', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [areasDados, ano, dataChamada, professorId, professorNome, trilhasState, addToast]);

  // Verificar se ha mudancas
  const hasAnyChanges = Object.values(trilhasState).some(area =>
    Object.values(area).some(serie => serie.hasChanges)
  );

  return {
    trilhasState,
    isSaving,
    hasAnyChanges,
    initializeState,
    atualizarPresenca,
    marcarTodosPresentes,
    atualizarConteudo,
    marcarNaoRealizada,
    marcarRealizada,
    salvarTudo,
  };
}
