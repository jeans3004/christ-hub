'use client';

/**
 * Hook para gerenciar dados da pagina de turmas.
 */

import { useState, useEffect, useCallback } from 'react';
import { turmaService } from '@/services/firestore';
import { Turma, Turno } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { useModal } from '@/hooks/useModal';
import { TurmaForm, initialForm, generateNome } from '../types';

export function useTurmasPage(canAccess: boolean) {
  const { addToast } = useUIStore();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TurmaForm>(initialForm);

  const formModal = useModal<Turma>();
  const deleteModal = useModal<Turma>();

  const loadTurmas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await turmaService.getAll();
      setTurmas(data);
    } catch (error) {
      console.error('Error loading turmas:', error);
      addToast('Erro ao carregar turmas', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (canAccess) {
      loadTurmas();
    }
  }, [canAccess, loadTurmas]);

  // Auto-generate name when serie or turno changes
  useEffect(() => {
    if (form.serie && form.turno) {
      setForm(prev => ({ ...prev, nome: generateNome(prev.serie, prev.turno) }));
    }
  }, [form.serie, form.turno]);

  const handleOpenModal = useCallback((turma?: Turma) => {
    if (turma) {
      setForm({
        nome: turma.nome,
        serie: turma.serie,
        turno: turma.turno,
        ano: turma.ano,
      });
      formModal.open(turma);
    } else {
      setForm(initialForm);
      formModal.open();
    }
  }, [formModal]);

  const handleCloseModal = useCallback(() => {
    formModal.close();
    setForm(initialForm);
  }, [formModal]);

  const handleSave = useCallback(async () => {
    if (!form.nome || !form.serie) {
      addToast('Preencha todos os campos obrigatorios', 'error');
      return;
    }

    setSaving(true);
    try {
      if (formModal.data) {
        await turmaService.update(formModal.data.id, { ...form, ativo: true });
        addToast('Turma atualizada com sucesso!', 'success');
      } else {
        await turmaService.create({ ...form, ativo: true });
        addToast('Turma criada com sucesso!', 'success');
      }
      handleCloseModal();
      loadTurmas();
    } catch (error) {
      console.error('Error saving turma:', error);
      addToast('Erro ao salvar turma', 'error');
    } finally {
      setSaving(false);
    }
  }, [form, formModal.data, addToast, handleCloseModal, loadTurmas]);

  const handleDelete = useCallback(async () => {
    if (!deleteModal.data) return;

    try {
      await turmaService.update(deleteModal.data.id, { ativo: false });
      addToast('Turma desativada com sucesso!', 'success');
      deleteModal.close();
      loadTurmas();
    } catch (error) {
      console.error('Error deleting turma:', error);
      addToast('Erro ao desativar turma', 'error');
    }
  }, [deleteModal, addToast, loadTurmas]);

  return {
    turmas,
    loading,
    saving,
    form,
    setForm,
    formModal,
    deleteModal,
    handleOpenModal,
    handleCloseModal,
    handleSave,
    handleDelete,
  };
}
