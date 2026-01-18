/**
 * Hook para logica da aba de rubricas.
 */

import { useState, useMemo, useCallback } from 'react';
import { rubricaService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { Rubrica } from '@/types';
import { DEFAULT_RUBRICAS } from '../../types';
import type { GrupoRubricas } from './types';

export function useRubricasTab(rubricas: Rubrica[], onRefresh: () => void) {
  const { addToast } = useUIStore();
  const { usuario } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRubrica, setEditingRubrica] = useState<Rubrica | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | false>('geral');

  // Agrupar rubricas por tipo e criador
  const grupos = useMemo((): GrupoRubricas[] => {
    const grupoGeral: GrupoRubricas = {
      nome: 'Geral/Colegiado',
      tipo: 'geral',
      rubricas: rubricas.filter((r) => r.tipo === 'geral' || !r.tipo),
    };

    const rubricasProfessores = rubricas.filter((r) => r.tipo === 'professor');
    const gruposPorProfessor = new Map<string, GrupoRubricas>();

    rubricasProfessores.forEach((r) => {
      const key = r.criadorId || 'desconhecido';
      if (!gruposPorProfessor.has(key)) {
        gruposPorProfessor.set(key, {
          nome: r.criadorNome || 'Professor',
          tipo: 'professor',
          criadorId: r.criadorId,
          rubricas: [],
        });
      }
      gruposPorProfessor.get(key)!.rubricas.push(r);
    });

    const gruposProfessores = Array.from(gruposPorProfessor.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome)
    );

    return [grupoGeral, ...gruposProfessores];
  }, [rubricas]);

  const handleOpenModal = useCallback((rubrica?: Rubrica) => {
    setEditingRubrica(rubrica || null);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingRubrica(null);
  }, []);

  const handleDelete = useCallback(async (rubrica: Rubrica) => {
    if (!confirm(`Deseja realmente excluir a rubrica "${rubrica.nome}"?`)) return;

    setDeleting(rubrica.id);
    try {
      await rubricaService.delete(rubrica.id);
      addToast('Rubrica excluida com sucesso!', 'success');
      onRefresh();
    } catch (error) {
      console.error('Error deleting rubrica:', error);
      addToast('Erro ao excluir rubrica', 'error');
    } finally {
      setDeleting(null);
    }
  }, [addToast, onRefresh]);

  const handleInitializeDefaults = useCallback(async () => {
    if (!confirm('Deseja criar as rubricas padrao do Colegiado? Isso criara 4 rubricas basicas.')) return;

    setInitializing(true);
    try {
      for (let i = 0; i < DEFAULT_RUBRICAS.length; i++) {
        const rubrica = DEFAULT_RUBRICAS[i];
        await rubricaService.create({
          nome: rubrica.nome,
          descricao: rubrica.descricao,
          niveis: rubrica.niveis,
          ativo: true,
          ordem: i + 1,
          tipo: 'geral',
        });
      }
      addToast('Rubricas padrao criadas com sucesso!', 'success');
      onRefresh();
    } catch (error) {
      console.error('Error initializing rubricas:', error);
      addToast('Erro ao criar rubricas padrao', 'error');
    } finally {
      setInitializing(false);
    }
  }, [addToast, onRefresh]);

  const canEdit = useCallback((rubrica: Rubrica): boolean => {
    if (rubrica.tipo === 'geral') return true;
    return rubrica.criadorId === usuario?.id;
  }, [usuario?.id]);

  const getGroupKey = useCallback((grupo: GrupoRubricas): string => {
    return grupo.tipo === 'geral' ? 'geral' : grupo.criadorId || '';
  }, []);

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroup((prev) => (prev === key ? false : key));
  }, []);

  return {
    grupos,
    modalOpen,
    editingRubrica,
    deleting,
    initializing,
    expandedGroup,
    handleOpenModal,
    handleCloseModal,
    handleDelete,
    handleInitializeDefaults,
    canEdit,
    getGroupKey,
    toggleGroup,
  };
}
