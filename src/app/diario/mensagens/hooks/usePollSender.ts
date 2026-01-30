/**
 * Hook para enviar enquetes/polls via WhatsApp.
 */

import { useState, useCallback } from 'react';
import { EnqueteFormData, initialEnqueteForm, PollPayload } from '../types';

interface SendPollResult {
  success: boolean;
  total: number;
  enviadas: number;
  falhas: number;
  error?: string;
}

interface UsePollSenderReturn {
  form: EnqueteFormData;
  setForm: React.Dispatch<React.SetStateAction<EnqueteFormData>>;
  resetForm: () => void;
  sending: boolean;
  result: SendPollResult | null;
  clearResult: () => void;
  sendPoll: (destinatarios: string[]) => Promise<boolean>;
  sendPollToGroup: (groupId: string) => Promise<boolean>;
  addOpcao: () => void;
  removeOpcao: (index: number) => void;
  updateOpcao: (index: number, value: string) => void;
  updatePergunta: (value: string) => void;
  setMultiplaEscolha: (value: boolean) => void;
  setMaxSelecoes: (value: number) => void;
}

export function usePollSender(): UsePollSenderReturn {
  const [form, setForm] = useState<EnqueteFormData>(initialEnqueteForm);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendPollResult | null>(null);

  const resetForm = useCallback(() => {
    setForm(initialEnqueteForm);
    setResult(null);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  const addOpcao = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      opcoes: [...prev.opcoes, ''],
    }));
  }, []);

  const removeOpcao = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      opcoes: prev.opcoes.filter((_, i) => i !== index),
    }));
  }, []);

  const updateOpcao = useCallback((index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      opcoes: prev.opcoes.map((opt, i) => (i === index ? value : opt)),
    }));
  }, []);

  const updatePergunta = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, pergunta: value }));
  }, []);

  const setMultiplaEscolha = useCallback((value: boolean) => {
    setForm((prev) => ({
      ...prev,
      multiplaEscolha: value,
      maxSelecoes: value ? prev.opcoes.length : 1,
    }));
  }, []);

  const setMaxSelecoes = useCallback((value: number) => {
    setForm((prev) => ({
      ...prev,
      maxSelecoes: Math.max(2, Math.min(value, prev.opcoes.length)),
    }));
  }, []);

  const buildPollPayload = useCallback((): PollPayload | null => {
    const validOpcoes = form.opcoes.filter((o) => o.trim() !== '');

    if (!form.pergunta.trim() || validOpcoes.length < 2) {
      return null;
    }

    return {
      name: form.pergunta.trim(),
      selectableCount: form.multiplaEscolha ? form.maxSelecoes : 1,
      values: validOpcoes,
    };
  }, [form]);

  const sendPoll = useCallback(async (destinatarios: string[]): Promise<boolean> => {
    const pollPayload = buildPollPayload();
    if (!pollPayload || destinatarios.length === 0) {
      setResult({ success: false, total: 0, enviadas: 0, falhas: 0, error: 'Dados invalidos' });
      return false;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/whatsapp/send-poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarios,
          poll: pollPayload,
        }),
      });

      // Tentar parsear JSON com tratamento de erro
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
      console.error('Erro ao enviar enquete:', err);
      setResult({ success: false, total: destinatarios.length, enviadas: 0, falhas: destinatarios.length, error: 'Erro de conexao' });
      return false;
    } finally {
      setSending(false);
    }
  }, [buildPollPayload]);

  const sendPollToGroup = useCallback(async (groupId: string): Promise<boolean> => {
    const pollPayload = buildPollPayload();
    if (!pollPayload || !groupId) {
      setResult({ success: false, total: 0, enviadas: 0, falhas: 0, error: 'Dados invalidos' });
      return false;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/whatsapp/send-poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          poll: pollPayload,
        }),
      });

      // Tentar parsear JSON com tratamento de erro
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
      console.error('Erro ao enviar enquete para grupo:', err);
      setResult({ success: false, total: 1, enviadas: 0, falhas: 1, error: 'Erro de conexao' });
      return false;
    } finally {
      setSending(false);
    }
  }, [buildPollPayload]);

  return {
    form,
    setForm,
    resetForm,
    sending,
    result,
    clearResult,
    sendPoll,
    sendPollToGroup,
    addOpcao,
    removeOpcao,
    updateOpcao,
    updatePergunta,
    setMultiplaEscolha,
    setMaxSelecoes,
  };
}
