/**
 * Hook para enviar mensagens com botoes via WhatsApp.
 */

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ButtonFormData, ButtonPayload, initialButtonForm } from '../types';

interface SendButtonsResult {
  success: boolean;
  total: number;
  enviadas: number;
  falhas: number;
  error?: string;
}

interface UseButtonSenderReturn {
  form: ButtonFormData;
  sending: boolean;
  result: SendButtonsResult | null;
  clearResult: () => void;
  sendButtons: (destinatarios: string[]) => Promise<boolean>;
  sendButtonsToGroup: (groupId: string) => Promise<boolean>;
  addBotao: () => void;
  removeBotao: (index: number) => void;
  updateBotao: (index: number, texto: string) => void;
  updateTitulo: (value: string) => void;
  updateDescricao: (value: string) => void;
  updateRodape: (value: string) => void;
  resetForm: () => void;
}

export function useButtonSender(): UseButtonSenderReturn {
  const { usuario } = useAuthStore();
  const [form, setForm] = useState<ButtonFormData>(initialButtonForm);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendButtonsResult | null>(null);

  const resetForm = useCallback(() => {
    setForm(initialButtonForm);
    setResult(null);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  const addBotao = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      botoes: [...prev.botoes, { texto: '' }],
    }));
  }, []);

  const removeBotao = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      botoes: prev.botoes.filter((_, i) => i !== index),
    }));
  }, []);

  const updateBotao = useCallback((index: number, texto: string) => {
    setForm((prev) => ({
      ...prev,
      botoes: prev.botoes.map((b, i) => (i === index ? { texto } : b)),
    }));
  }, []);

  const updateTitulo = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, titulo: value }));
  }, []);

  const updateDescricao = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, descricao: value }));
  }, []);

  const updateRodape = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, rodape: value }));
  }, []);

  const buildPayload = useCallback((): ButtonPayload | null => {
    const validBotoes = form.botoes.filter((b) => b.texto.trim() !== '');

    if (!form.titulo.trim() || validBotoes.length === 0) {
      return null;
    }

    const rodape = form.rodape.trim();
    const nomeUsuario = usuario?.nome;
    const getDisplayName = (nome: string): string => {
      if (nome.toUpperCase().includes('COORDENACAO PEDAGOGICA') || nome.toUpperCase().includes('COORDENAÇÃO PEDAGÓGICA')) {
        return 'Coordenador Pedagógico Carlos Cruz';
      }
      return nome;
    };
    const footerTexto = nomeUsuario
      ? (rodape ? `${rodape} | ${getDisplayName(nomeUsuario)}` : getDisplayName(nomeUsuario))
      : (rodape || undefined);

    return {
      title: form.titulo.trim(),
      description: form.descricao.trim(),
      footer: footerTexto,
      buttons: validBotoes.map((b, i) => ({
        type: 'reply' as const,
        displayText: b.texto.trim(),
        id: `btn_${i + 1}`,
      })),
    };
  }, [form]);

  const sendButtons = useCallback(async (destinatarios: string[]): Promise<boolean> => {
    const payload = buildPayload();
    if (!payload || destinatarios.length === 0) {
      setResult({ success: false, total: 0, enviadas: 0, falhas: 0, error: 'Dados invalidos' });
      return false;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/whatsapp/send-buttons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarios,
          buttonMessage: payload,
        }),
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: 'Resposta invalida do servidor' };
      }

      if (!response.ok) {
        setResult({ success: false, total: destinatarios.length, enviadas: 0, falhas: destinatarios.length, error: data.error });
        return false;
      }

      setResult({
        success: data.falhas === 0,
        total: data.total || destinatarios.length,
        enviadas: data.enviadas || 0,
        falhas: data.falhas || 0,
      });

      return data.falhas === 0;
    } catch (err) {
      console.error('Erro ao enviar botoes:', err);
      setResult({ success: false, total: destinatarios.length, enviadas: 0, falhas: destinatarios.length, error: 'Erro de conexao' });
      return false;
    } finally {
      setSending(false);
    }
  }, [buildPayload]);

  const sendButtonsToGroup = useCallback(async (groupId: string): Promise<boolean> => {
    const payload = buildPayload();
    if (!payload || !groupId) {
      setResult({ success: false, total: 0, enviadas: 0, falhas: 0, error: 'Dados invalidos' });
      return false;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/whatsapp/send-buttons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          buttonMessage: payload,
        }),
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: 'Resposta invalida do servidor' };
      }

      if (!response.ok) {
        setResult({ success: false, total: 1, enviadas: 0, falhas: 1, error: data.error });
        return false;
      }

      setResult({ success: true, total: 1, enviadas: 1, falhas: 0 });
      return true;
    } catch (err) {
      console.error('Erro ao enviar botoes para grupo:', err);
      setResult({ success: false, total: 1, enviadas: 0, falhas: 1, error: 'Erro de conexao' });
      return false;
    } finally {
      setSending(false);
    }
  }, [buildPayload]);

  return {
    form,
    sending,
    result,
    clearResult,
    sendButtons,
    sendButtonsToGroup,
    addBotao,
    removeBotao,
    updateBotao,
    updateTitulo,
    updateDescricao,
    updateRodape,
    resetForm,
  };
}
