'use client';

/**
 * Hook para carregar dados da pagina de professores.
 */

import { useState, useEffect, useCallback } from 'react';
import { Usuario, Disciplina, Turma } from '@/types';
import { usuarioService, disciplinaService, turmaService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';
import { useFilterStore } from '@/store/filterStore';
import { ProfessorTableRow, ProfessorFiltro, toProfessorTableRow, initialFiltro } from '../types';

interface UseProfessoresLoaderReturn {
  professores: Usuario[];
  professoresTable: ProfessorTableRow[];
  disciplinas: Disciplina[];
  turmas: Turma[];
  loading: boolean;
  filtro: ProfessorFiltro;
  setFiltro: React.Dispatch<React.SetStateAction<ProfessorFiltro>>;
  reload: () => Promise<void>;
}

export function useProfessoresLoader(): UseProfessoresLoaderReturn {
  const { addToast } = useUIStore();
  const { ano } = useFilterStore();

  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<ProfessorFiltro>(initialFiltro);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [professoresData, disciplinasData, turmasData] = await Promise.all([
        usuarioService.getProfessores(),
        disciplinaService.getSelectable(),
        turmaService.getByAno(ano),
      ]);

      setProfessores(professoresData);
      setDisciplinas(disciplinasData);
      setTurmas(turmasData);
    } catch (error) {
      console.error('Error loading professores data:', error);
      addToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, [ano, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Transformar professores em ProfessorTableRow com filtros aplicados
  const professoresTable: ProfessorTableRow[] = professores
    .map(p => toProfessorTableRow(p, disciplinas, turmas))
    .filter(p => {
      // Filtro por nome
      if (filtro.nome && !p.nome.toLowerCase().includes(filtro.nome.toLowerCase())) {
        return false;
      }

      // Filtro por status
      if (filtro.status === 'ativos' && p.statusLabel !== 'Ativo') {
        return false;
      }
      if (filtro.status === 'pendentes' && p.statusLabel !== 'Aguardando acesso') {
        return false;
      }
      if (filtro.status === 'inativos' && p.statusLabel !== 'Inativo') {
        return false;
      }

      return true;
    });

  return {
    professores,
    professoresTable,
    disciplinas,
    turmas,
    loading,
    filtro,
    setFiltro,
    reload: loadData,
  };
}
