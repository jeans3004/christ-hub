'use client';

/**
 * Hook para carregar dados de usuários.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Usuario, Turma, Disciplina } from '@/types';
import { usuarioService, turmaService, disciplinaService } from '@/services/firestore';
import { UsuarioFilters, UsuarioWithDetails } from '../types';

export function useUsuariosLoader() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UsuarioFilters>({
    search: '',
    tipo: 'todos',
    status: 'todos',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [usuariosData, turmasData, disciplinasData] = await Promise.all([
        usuarioService.getAll(),
        turmaService.getAll(),
        disciplinaService.getAtivas(),
      ]);

      setUsuarios(usuariosData);
      setTurmas(turmasData);
      setDisciplinas(disciplinasData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados dos usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mapear turmas e disciplinas para nomes
  const turmasMap = useMemo(() => {
    const map = new Map<string, string>();
    turmas.forEach(t => map.set(t.id, t.nome));
    return map;
  }, [turmas]);

  const disciplinasMap = useMemo(() => {
    const map = new Map<string, string>();
    disciplinas.forEach(d => map.set(d.id, d.nome));
    return map;
  }, [disciplinas]);

  // Enriquecer usuários com nomes de turmas e disciplinas
  const usuariosWithDetails: UsuarioWithDetails[] = useMemo(() => {
    return usuarios.map(u => ({
      ...u,
      turmasNomes: u.turmaIds?.map(id => turmasMap.get(id) || id) || [],
      disciplinasNomes: u.disciplinaIds?.map(id => disciplinasMap.get(id) || id) || [],
    }));
  }, [usuarios, turmasMap, disciplinasMap]);

  // Filtrar usuários
  const filteredUsuarios = useMemo(() => {
    return usuariosWithDetails.filter(u => {
      // Filtro de busca
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchNome = u.nome.toLowerCase().includes(search);
        const matchEmail = u.email?.toLowerCase().includes(search);
        const matchGoogleEmail = u.googleEmail?.toLowerCase().includes(search);
        const matchCpf = u.cpf?.includes(search);
        if (!matchNome && !matchEmail && !matchGoogleEmail && !matchCpf) {
          return false;
        }
      }

      // Filtro de tipo
      if (filters.tipo !== 'todos' && u.tipo !== filters.tipo) {
        return false;
      }

      // Filtro de status
      if (filters.status === 'ativos' && !u.ativo) return false;
      if (filters.status === 'inativos' && u.ativo) return false;
      if (filters.status === 'pendentes' && u.authStatus !== 'pending') return false;

      return true;
    });
  }, [usuariosWithDetails, filters]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = usuarios.length;
    const ativos = usuarios.filter(u => u.ativo).length;
    const inativos = usuarios.filter(u => !u.ativo).length;
    const pendentes = usuarios.filter(u => u.authStatus === 'pending').length;
    const porTipo = {
      professor: usuarios.filter(u => u.tipo === 'professor').length,
      coordenador: usuarios.filter(u => u.tipo === 'coordenador').length,
      administrador: usuarios.filter(u => u.tipo === 'administrador').length,
    };
    return { total, ativos, inativos, pendentes, porTipo };
  }, [usuarios]);

  return {
    usuarios: filteredUsuarios,
    allUsuarios: usuarios,
    turmas,
    disciplinas,
    loading,
    error,
    filters,
    setFilters,
    stats,
    reload: loadData,
  };
}
