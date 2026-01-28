'use client';

/**
 * Hook para carregar dados de horarios.
 */

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { horarioService, turmaService, disciplinaService, usuarioService } from '@/services/firestore';
import { HorarioAula, Turma, Disciplina, Usuario } from '@/types';

interface UseHorariosLoaderReturn {
  horarios: HorarioAula[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  professores: Usuario[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseHorariosLoaderParams {
  ano: number;
  turmaId?: string;
  professorId?: string;
}

export function useHorariosLoader({
  ano,
  turmaId,
  professorId,
}: UseHorariosLoaderParams): UseHorariosLoaderReturn {
  const { addToast } = useUIStore();
  const { isCoordinatorOrAbove, turmaIds, usuario } = usePermissions();

  // Calcular uma vez para evitar loop infinito no useCallback
  const isCoordOrAbove = isCoordinatorOrAbove();
  const usuarioId = usuario?.id;

  const [horarios, setHorarios] = useState<HorarioAula[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados base (turmas, disciplinas, professores)
  useEffect(() => {
    let isMounted = true;

    const loadBaseData = async () => {
      try {
        const [turmasData, disciplinasData, professoresData] = await Promise.all([
          turmaService.getByAno(ano),
          disciplinaService.getAll(),
          usuarioService.getProfessoresAtivos(),
        ]);

        if (!isMounted) return;

        // Filtrar turmas por permissao
        let turmasFiltradas = turmasData;
        if (!isCoordOrAbove && turmaIds.length > 0) {
          turmasFiltradas = turmasData.filter(t => turmaIds.includes(t.id));
        }

        setTurmas(turmasFiltradas);
        setDisciplinas(disciplinasData.filter(d => !d.isGroup && d.ativo));
        setProfessores(professoresData);
      } catch (err) {
        console.error('Erro ao carregar dados base:', err);
        if (isMounted) {
          addToast('Erro ao carregar dados', 'error');
        }
      }
    };

    loadBaseData();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano]);

  // Carregar horarios baseado nos filtros
  const fetchHorarios = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let horariosData: HorarioAula[];

      if (turmaId) {
        horariosData = await horarioService.getByTurma(turmaId, ano);
      } else if (professorId) {
        horariosData = await horarioService.getByProfessor(professorId, ano);
      } else {
        // Carregar todos os horarios do ano (para visualizacao de grade)
        horariosData = await horarioService.getByAno(ano);
      }

      // Filtrar horarios pessoais: visivel apenas para o criador ou coordenacao+
      const horariosFiltered = horariosData.filter(h => {
        // Horario oficial - sempre visivel
        if (!h.pessoal) return true;
        // Horario pessoal - visivel para coordenacao+
        if (isCoordOrAbove) return true;
        // Horario pessoal - visivel apenas para o criador
        return h.createdBy === usuarioId || h.professorId === usuarioId;
      });

      setHorarios(horariosFiltered);
    } catch (err) {
      console.error('Erro ao carregar horarios:', err);
      setError('Erro ao carregar horarios');
    } finally {
      setLoading(false);
    }
  }, [ano, turmaId, professorId, isCoordOrAbove, usuarioId]);

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  return {
    horarios,
    turmas,
    disciplinas,
    professores,
    loading,
    error,
    refetch: fetchHorarios,
  };
}
