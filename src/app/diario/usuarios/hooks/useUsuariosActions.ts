'use client';

/**
 * Hook para ações CRUD de usuários.
 */

import { useState } from 'react';
import { Usuario } from '@/types';
import { usuarioService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';
import { UsuarioFormData } from '../types';

export function useUsuariosActions(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const addToast = useUIStore(state => state.addToast);

  const createUsuario = async (data: UsuarioFormData): Promise<boolean> => {
    try {
      setSaving(true);

      // Verificar se e-mail já existe
      const emailExists = await usuarioService.checkEmailExists(data.googleEmail);
      if (emailExists) {
        addToast('E-mail já cadastrado no sistema', 'error');
        return false;
      }

      await usuarioService.create({
        nome: data.nome,
        cpf: data.cpf,
        email: data.email || data.googleEmail,
        googleEmail: data.googleEmail,
        telefone: data.telefone,
        celular: data.celular,
        tipo: data.tipo,
        turmaIds: data.turmaIds,
        disciplinaIds: data.disciplinaIds,
        ativo: data.ativo,
        authStatus: 'pending',
        googleUid: null,
        firstLoginAt: null,
      });

      addToast('Usuário criado com sucesso', 'success');
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      addToast('Erro ao criar usuário', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateUsuario = async (id: string, data: Partial<UsuarioFormData>): Promise<boolean> => {
    try {
      setSaving(true);

      // Se está alterando o e-mail, verificar duplicidade
      if (data.googleEmail) {
        const emailExists = await usuarioService.checkEmailExists(data.googleEmail, id);
        if (emailExists) {
          addToast('E-mail já cadastrado no sistema', 'error');
          return false;
        }
      }

      await usuarioService.update(id, {
        ...data,
        email: data.email || data.googleEmail,
      });

      addToast('Usuário atualizado com sucesso', 'success');
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      addToast('Erro ao atualizar usuário', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteUsuario = async (id: string): Promise<boolean> => {
    try {
      setDeleting(true);
      await usuarioService.delete(id);
      addToast('Usuário excluído com sucesso', 'success');
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      addToast('Erro ao excluir usuário', 'error');
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const toggleAtivo = async (usuario: Usuario): Promise<boolean> => {
    try {
      setSaving(true);
      await usuarioService.update(usuario.id, { ativo: !usuario.ativo });
      addToast(
        usuario.ativo ? 'Usuário desativado' : 'Usuário ativado',
        'success'
      );
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      addToast('Erro ao alterar status do usuário', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetVinculacao = async (id: string): Promise<boolean> => {
    try {
      setSaving(true);
      await usuarioService.update(id, {
        authStatus: 'pending',
        googleUid: null,
        firstLoginAt: null,
      });
      addToast('Vinculação resetada. Usuário precisará fazer login novamente.', 'success');
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Erro ao resetar vinculação:', error);
      addToast('Erro ao resetar vinculação', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    createUsuario,
    updateUsuario,
    deleteUsuario,
    toggleAtivo,
    resetVinculacao,
    saving,
    deleting,
  };
}
