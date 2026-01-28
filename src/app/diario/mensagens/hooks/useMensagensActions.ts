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
  MediaData,
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

  // Enviar mensagem de texto para um destinatário
  const sendTextMessage = async (dest: Destinatario, mensagem: string): Promise<boolean> => {
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinatarioId: dest.id,
        destinatarioNome: dest.nome,
        numero: dest.numero,
        mensagem,
        enviadoPorId: usuario?.id,
        enviadoPorNome: usuario?.nome,
        templateId: form.templateId,
      }),
    });
    const data = await response.json();
    return data.success;
  };

  // Enviar mídia para um destinatário
  const sendMediaMessage = async (dest: Destinatario, media: MediaData, caption: string): Promise<boolean> => {
    const response = await fetch('/api/whatsapp/send-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinatarioId: dest.id,
        destinatarioNome: dest.nome,
        numero: dest.numero,
        mediaType: media.type,
        mediaBase64: media.base64,
        mediaUrl: media.url,
        filename: media.filename,
        mimetype: media.mimetype,
        caption,
        enviadoPorId: usuario?.id,
        enviadoPorNome: usuario?.nome,
      }),
    });
    const data = await response.json();
    return data.success;
  };

  // Enviar mensagem (individual ou broadcast)
  const sendMessage = useCallback(async (): Promise<boolean> => {
    // Suporte para múltiplas mídias ou mídia única
    const medias = form.medias && form.medias.length > 0 ? form.medias : (form.media ? [form.media] : []);
    const hasMedia = medias.length > 0;
    const hasText = !!form.mensagem.trim();

    if (!hasMedia && !hasText) {
      addToast('Digite uma mensagem ou anexe uma mídia', 'error');
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
        let success = false;
        let allMediaSuccess = true;

        if (hasMedia) {
          // Enviar todas as mídias (caption apenas na primeira)
          for (let i = 0; i < medias.length; i++) {
            const mediaSuccess = await sendMediaMessage(
              dest,
              medias[i],
              i === 0 ? form.mensagem : '' // Caption apenas na primeira mídia
            );
            if (!mediaSuccess) allMediaSuccess = false;

            // Delay entre mídias
            if (i < medias.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          success = allMediaSuccess;
        } else {
          // Enviar texto
          success = await sendTextMessage(dest, form.mensagem);
        }

        if (success) {
          addToast(hasMedia ? 'Mídia enviada com sucesso!' : 'Mensagem enviada com sucesso!', 'success');
          setSendResult({
            success: true,
            total: 1,
            enviadas: 1,
            falhas: 0,
          });
          onSuccess?.();
          return true;
        } else {
          addToast('Erro ao enviar', 'error');
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
      if (hasMedia) {
        // Envio em massa de mídias - enviar para cada destinatário com delay
        let enviadas = 0;
        let falhas = 0;
        const results: Array<{ id: string; nome: string; success: boolean; error?: string }> = [];

        for (let i = 0; i < form.destinatarios.length; i++) {
          const dest = form.destinatarios[i];
          try {
            let destSuccess = true;

            // Enviar todas as mídias para este destinatário
            for (let j = 0; j < medias.length; j++) {
              const mediaSuccess = await sendMediaMessage(
                dest,
                medias[j],
                j === 0 ? form.mensagem : '' // Caption apenas na primeira mídia
              );
              if (!mediaSuccess) destSuccess = false;

              // Delay entre mídias para o mesmo destinatário
              if (j < medias.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            if (destSuccess) {
              enviadas++;
              results.push({ id: dest.id, nome: dest.nome, success: true });
            } else {
              falhas++;
              results.push({ id: dest.id, nome: dest.nome, success: false, error: 'Falha no envio' });
            }
          } catch {
            falhas++;
            results.push({ id: dest.id, nome: dest.nome, success: false, error: 'Erro de conexão' });
          }

          // Delay entre destinatários para evitar bloqueio
          if (i < form.destinatarios.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }

        setSendResult({
          success: enviadas > 0,
          total: form.destinatarios.length,
          enviadas,
          falhas,
          results,
        });

        const mediaLabel = medias.length > 1 ? `${medias.length} anexos` : 'mídia';
        if (enviadas === form.destinatarios.length) {
          addToast(`${mediaLabel} enviados para ${enviadas} destinatários!`, 'success');
        } else if (enviadas > 0) {
          addToast(`${mediaLabel} enviados para ${enviadas} de ${form.destinatarios.length} destinatários`, 'warning');
        } else {
          addToast('Falha ao enviar mídias', 'error');
        }

        onSuccess?.();
        return enviadas > 0;
      }

      // Envio em massa de texto (usa endpoint bulk)
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
