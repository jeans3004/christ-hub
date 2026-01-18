'use client';

/**
 * Hook para acoes CRUD de professores.
 */

import { useState, useCallback } from 'react';
import { Usuario } from '@/types';
import { usuarioService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useModal } from '@/hooks/useModal';
import {
  ProfessorFormData,
  initialFormData,
  validateForm,
  hasErrors,
} from '../types';

interface UseProfessoresActionsReturn {
  form: ProfessorFormData;
  setForm: React.Dispatch<React.SetStateAction<ProfessorFormData>>;
  saving: boolean;
  formModal: ReturnType<typeof useModal<Usuario>>;
  deleteModal: ReturnType<typeof useModal<Usuario>>;
  handleOpenModal: (professor?: Usuario) => void;
  handleCloseModal: () => void;
  handleSave: () => Promise<boolean>;
  handleToggleStatus: (professor: Usuario) => Promise<void>;
}

export function useProfessoresActions(onSuccess: () => void): UseProfessoresActionsReturn {
  const { addToast } = useUIStore();
  const { usuario: currentUser } = useAuthStore();

  const [form, setForm] = useState<ProfessorFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const formModal = useModal<Usuario>();
  const deleteModal = useModal<Usuario>();

  const handleOpenModal = useCallback((professor?: Usuario) => {
    if (professor) {
      setForm({
        nome: professor.nome,
        googleEmail: professor.googleEmail || professor.email || '',
        googleUid: professor.googleUid || '',
        tipo: professor.tipo === 'administrador' ? 'coordenador' : professor.tipo,
        disciplinaIds: professor.disciplinaIds || [],
        turmaIds: professor.turmaIds || [],
        hasAccess: professor.authStatus === 'linked',
      });
      formModal.open(professor);
    } else {
      setForm(initialFormData);
      formModal.open();
    }
  }, [formModal]);

  const handleCloseModal = useCallback(() => {
    formModal.close();
    setForm(initialFormData);
  }, [formModal]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    // Validar formulario
    const errors = validateForm(form);
    if (hasErrors(errors)) {
      const firstError = Object.values(errors)[0];
      addToast(firstError || 'Preencha os campos obrigatorios', 'error');
      return false;
    }

    setSaving(true);
    try {
      // Verificar e-mail unico
      const emailExists = await usuarioService.checkEmailExists(
        form.googleEmail,
        formModal.data?.id
      );
      if (emailExists) {
        addToast('Este e-mail ja esta cadastrado no sistema', 'error');
        setSaving(false);
        return false;
      }

      const professorData: Partial<Usuario> = {
        nome: form.nome,
        email: form.googleEmail,
        googleEmail: form.googleEmail,
        tipo: form.tipo,
        disciplinaIds: form.disciplinaIds,
        turmaIds: form.turmaIds,
        ativo: true,
      };

      if (form.hasAccess) {
        professorData.googleUid = form.googleUid;
        professorData.authStatus = 'linked';
      } else {
        professorData.googleUid = null;
        professorData.authStatus = 'pending';
      }

      if (formModal.data) {
        // Edicao
        await usuarioService.update(formModal.data.id, professorData);
        addToast('Professor atualizado com sucesso!', 'success');
      } else {
        // Criacao
        await usuarioService.create({
          ...professorData,
          cpf: '',
          createdBy: currentUser?.id,
        } as Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>);
        addToast('Professor cadastrado com sucesso!', 'success');
      }

      handleCloseModal();
      onSuccess();
      return true;
    } catch (error) {
      console.error('Error saving professor:', error);
      addToast('Erro ao salvar professor', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [form, formModal.data, currentUser, addToast, handleCloseModal, onSuccess]);

  const handleToggleStatus = useCallback(async (professor: Usuario) => {
    try {
      const newStatus = !professor.ativo;
      await usuarioService.update(professor.id, { ativo: newStatus });
      addToast(
        newStatus ? 'Professor ativado com sucesso!' : 'Professor desativado com sucesso!',
        'success'
      );
      deleteModal.close();
      onSuccess();
    } catch (error) {
      console.error('Error toggling professor status:', error);
      addToast('Erro ao alterar status do professor', 'error');
    }
  }, [addToast, deleteModal, onSuccess]);

  return {
    form,
    setForm,
    saving,
    formModal,
    deleteModal,
    handleOpenModal,
    handleCloseModal,
    handleSave,
    handleToggleStatus,
  };
}
