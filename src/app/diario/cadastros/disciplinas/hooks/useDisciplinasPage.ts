'use client';

/**
 * Hook para gerenciar dados da pagina de disciplinas com hierarquia.
 */

import { useState, useEffect, useCallback } from 'react';
import { disciplinaService, turmaService } from '@/services/firestore';
import { Disciplina, Turma } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { useModal } from '@/hooks/useModal';
import { DisciplinaForm, DisciplinaNode, initialForm, DeleteChildrenAction } from '../types';
import { useDisciplinasTree } from './useDisciplinasTree';

export function useDisciplinasPage(canAccess: boolean) {
  const { addToast } = useUIStore();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DisciplinaForm>(initialForm);

  const formModal = useModal<Disciplina>();
  const deleteModal = useModal<DisciplinaNode>();

  // Hook de arvore
  const treeUtils = useDisciplinasTree(disciplinas);
  const { tree, getAvailableParents, getFullPath, canHaveChildren, getDescendants } = treeUtils;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [disciplinasData, turmasData] = await Promise.all([
        disciplinaService.getAll(),
        turmaService.getAll(),
      ]);
      setDisciplinas(disciplinasData);
      setTurmas(turmasData.filter(t => t.ativo));
    } catch (error) {
      console.error('Error loading data:', error);
      addToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (canAccess) {
      loadData();
    }
  }, [canAccess, loadData]);

  const handleOpenModal = useCallback((disciplina?: Disciplina, parentId?: string) => {
    if (disciplina) {
      setForm({
        nome: disciplina.nome,
        codigo: disciplina.codigo || '',
        turmaIds: disciplina.turmaIds || [],
        parentId: disciplina.parentId || null,
        isGroup: disciplina.isGroup || false,
      });
      formModal.open(disciplina);
    } else {
      setForm({
        ...initialForm,
        parentId: parentId || null,
        // Se criar na raiz (sem parentId), sugerir como grupo
        isGroup: !parentId,
      });
      formModal.open();
    }
  }, [formModal]);

  const handleCloseModal = useCallback(() => {
    formModal.close();
    setForm(initialForm);
  }, [formModal]);

  const handleSave = useCallback(async () => {
    if (!form.nome) {
      addToast('Preencha o nome da disciplina', 'error');
      return;
    }

    // Grupos nao precisam de turmas
    if (!form.isGroup && form.turmaIds.length === 0) {
      addToast('Selecione pelo menos uma turma', 'error');
      return;
    }

    setSaving(true);
    try {
      const ordem = formModal.data?.ordem || await disciplinaService.getNextOrder(form.parentId);

      const disciplinaData = {
        nome: form.nome,
        ...(form.codigo && !form.isGroup ? { codigo: form.codigo } : {}),
        turmaIds: form.isGroup ? [] : form.turmaIds,
        parentId: form.parentId || null,
        ordem,
        isGroup: form.isGroup,
        ativo: true,
      };

      if (formModal.data) {
        await disciplinaService.update(formModal.data.id, disciplinaData);
        addToast('Disciplina atualizada com sucesso!', 'success');
      } else {
        await disciplinaService.create(disciplinaData);
        addToast('Disciplina criada com sucesso!', 'success');
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error saving disciplina:', error);
      addToast('Erro ao salvar disciplina', 'error');
    } finally {
      setSaving(false);
    }
  }, [form, formModal.data, addToast, handleCloseModal, loadData]);

  const handleDelete = useCallback(async (action: DeleteChildrenAction = 'move_to_root') => {
    if (!deleteModal.data) return;

    try {
      const node = deleteModal.data;

      if (node.hasChildren) {
        if (action === 'move_to_root') {
          await disciplinaService.moveChildrenToRoot(node.id);
        } else {
          await disciplinaService.deactivateWithChildren(node.id);
          addToast('Disciplina e subdisciplinas desativadas!', 'success');
          deleteModal.close();
          loadData();
          return;
        }
      }

      await disciplinaService.update(node.id, { ativo: false });
      addToast('Disciplina desativada com sucesso!', 'success');
      deleteModal.close();
      loadData();
    } catch (error) {
      console.error('Error deleting disciplina:', error);
      addToast('Erro ao desativar disciplina', 'error');
    }
  }, [deleteModal, addToast, loadData]);

  const handleAddChild = useCallback((parentId: string) => {
    handleOpenModal(undefined, parentId);
  }, [handleOpenModal]);

  return {
    // Dados
    disciplinas,
    turmas,
    tree,
    loading,
    saving,
    form,
    setForm,

    // Modais
    formModal,
    deleteModal,

    // Handlers
    handleOpenModal,
    handleCloseModal,
    handleSave,
    handleDelete,
    handleAddChild,

    // Utilitarios de arvore
    getAvailableParents,
    getFullPath,
    canHaveChildren,
    getDescendants,
  };
}
