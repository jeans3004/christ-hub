'use client';

/**
 * Hook para acoes de envio de mensagens.
 */

import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { templateMensagemService } from '@/services/firestore';
import { TemplateMensagem, TemplateCategoria } from '@/types';
import {
  MensagemFormData,
  initialFormData,
  Destinatario,
  SendResult,
} from '../types';

interface UseMensagensActionsReturn {
  // Estado do formulario
  form: MensagemFormData;
  setForm: React.Dispatch<React.SetStateAction<MensagemFormData>>;

  // Estados
  sending: boolean;
  sendResult: SendResult | null;

  // Acoes de envio
  sendMessage: () => Promise<boolean>;
  sendToGroup: (groupId: string, groupName: string) => Promise<boolean>;
  resetForm: () => void;
  clearResult: () => void;

  // Acoes de template
  applyTemplate: (template: TemplateMensagem, variables?: Record<string, string>) => void;
  saveTemplate: (data: Omit<TemplateMensagem, 'id' | 'createdAt' | 'updatedAt' | 'variaveis' | 'usageCount'>) => Promise<boolean>;
}

export function useMensagensActions(
  onSuccess?: () => void
): UseMensagensActionsReturn {
  const { addToast } = useUIStore();
  const { usuario } = useAuthStore();

  const [form, setForm] = useState<MensagemFormData>(initialFormData);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  // Resetar formulario
  const resetForm = useCallback(() => {
    setForm(initialFormData);
    setSendResult(null);
  }, []);

  // Limpar resultado
  const clearResult = useCallback(() => {
    setSendResult(null);
  }, []);

  // Enviar mensagem (individual ou broadcast)
  const sendMessage = useCallback(async (): Promise<boolean> => {
    if (!form.mensagem.trim()) {
      addToast('Digite uma mensagem', 'error');
      return false;
    }

    if (form.destinatarios.length === 0) {
      addToast('Selecione ao menos um destinatario', 'error');
      return false;
    }

    if (!usuario) {
      addToast('Usuario nao autenticado', 'error');
      return false;
    }

    setSending(true);
    setSendResult(null);

    try {
      // Envio individual
      if (form.destinatarios.length === 1) {
        const dest = form.destinatarios[0];

        const response = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destinatarioId: dest.id,
            destinatarioNome: dest.nome,
            numero: dest.numero,
            mensagem: form.mensagem,
            enviadoPorId: usuario.id,
            enviadoPorNome: usuario.nome,
            templateId: form.templateId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          addToast('Mensagem enviada com sucesso!', 'success');
          setSendResult({
            success: true,
            total: 1,
            enviadas: 1,
            falhas: 0,
          });
          onSuccess?.();
          return true;
        } else {
          addToast(data.error || 'Erro ao enviar mensagem', 'error');
          setSendResult({
            success: false,
            total: 1,
            enviadas: 0,
            falhas: 1,
          });
          return false;
        }
      }

      // Envio em massa (broadcast)
      const response = await fetch('/api/whatsapp/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarios: form.destinatarios.map((d) => ({
            id: d.id,
            nome: d.nome,
            numero: d.numero,
          })),
          mensagem: form.mensagem,
          enviadoPorId: usuario.id,
          enviadoPorNome: usuario.nome,
          templateId: form.templateId,
        }),
      });

      const data = await response.json();

      setSendResult({
        success: data.enviadas > 0,
        total: data.total,
        enviadas: data.enviadas,
        falhas: data.falhas,
        results: data.results,
      });

      if (data.enviadas === data.total) {
        addToast(`${data.enviadas} mensagens enviadas com sucesso!`, 'success');
      } else if (data.enviadas > 0) {
        addToast(`${data.enviadas} de ${data.total} mensagens enviadas`, 'warning');
      } else {
        addToast('Falha ao enviar mensagens', 'error');
      }

      onSuccess?.();
      return data.enviadas > 0;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      addToast('Erro ao enviar mensagem', 'error');
      return false;
    } finally {
      setSending(false);
    }
  }, [form, usuario, addToast, onSuccess]);

  // Enviar para grupo
  const sendToGroup = useCallback(
    async (groupId: string, groupName: string): Promise<boolean> => {
      if (!form.mensagem.trim()) {
        addToast('Digite uma mensagem', 'error');
        return false;
      }

      if (!usuario) {
        addToast('Usuario nao autenticado', 'error');
        return false;
      }

      setSending(true);

      try {
        const response = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destinatarioId: groupId,
            destinatarioNome: groupName,
            numero: groupId,
            mensagem: form.mensagem,
            enviadoPorId: usuario.id,
            enviadoPorNome: usuario.nome,
            tipo: 'grupo',
          }),
        });

        const data = await response.json();

        if (data.success) {
          addToast(`Mensagem enviada para o grupo "${groupName}"!`, 'success');
          onSuccess?.();
          return true;
        } else {
          addToast(data.error || 'Erro ao enviar para grupo', 'error');
          return false;
        }
      } catch (error) {
        console.error('Erro ao enviar para grupo:', error);
        addToast('Erro ao enviar para grupo', 'error');
        return false;
      } finally {
        setSending(false);
      }
    },
    [form.mensagem, usuario, addToast, onSuccess]
  );

  // Aplicar template
  const applyTemplate = useCallback(
    (template: TemplateMensagem, variables?: Record<string, string>) => {
      let mensagem = template.conteudo;

      // Substituir variaveis se fornecidas
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          mensagem = mensagem.replace(regex, value);
        });
      }

      setForm((prev) => ({
        ...prev,
        mensagem,
        templateId: template.id,
      }));

      addToast(`Template "${template.nome}" aplicado`, 'info');
    },
    [addToast]
  );

  // Salvar novo template
  const saveTemplate = useCallback(
    async (
      data: Omit<TemplateMensagem, 'id' | 'createdAt' | 'updatedAt' | 'variaveis' | 'usageCount'>
    ): Promise<boolean> => {
      if (!usuario) {
        addToast('Usuario nao autenticado', 'error');
        return false;
      }

      try {
        await templateMensagemService.create({
          ...data,
          criadoPorId: usuario.id,
          criadoPorNome: usuario.nome,
        });

        addToast('Template salvo com sucesso!', 'success');
        return true;
      } catch (error) {
        console.error('Erro ao salvar template:', error);
        addToast('Erro ao salvar template', 'error');
        return false;
      }
    },
    [usuario, addToast]
  );

  return {
    form,
    setForm,
    sending,
    sendResult,
    sendMessage,
    sendToGroup,
    resetForm,
    clearResult,
    applyTemplate,
    saveTemplate,
  };
}
