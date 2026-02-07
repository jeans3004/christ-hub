'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatConversation, ChatMessage } from '../types';

const CHAT_LIST_INTERVAL = 30_000; // 30s para lista
const MESSAGES_INTERVAL = 7_000;   // 7s para mensagens ativas

export function useChat(active: boolean) {
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const chatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const msgIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Buscar lista de conversas
  const fetchChats = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoadingChats(true);
      const res = await fetch('/api/whatsapp/chats');
      if (!res.ok) throw new Error('Erro ao buscar conversas');
      const data: ChatConversation[] = await res.json();
      setChats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoadingChats(false);
    }
  }, []);

  // Buscar mensagens da conversa selecionada
  const fetchMessages = useCallback(async (jid: string, showLoading = false) => {
    try {
      if (showLoading) setLoadingMessages(true);
      const res = await fetch('/api/whatsapp/chats/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteJid: jid, limit: 50 }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn('Erro ao buscar mensagens:', errData.error || res.status);
        return;
      }
      const data: ChatMessage[] = await res.json();
      setMessages(data);
    } catch (err) {
      console.warn('Erro ao buscar mensagens:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Selecionar conversa
  const selectChat = useCallback((jid: string) => {
    setSelectedJid(jid);
    setMessages([]);
    fetchMessages(jid, true);
  }, [fetchMessages]);

  // Voltar para lista (mobile)
  const deselectChat = useCallback(() => {
    setSelectedJid(null);
    setMessages([]);
  }, []);

  // Enviar mensagem
  const sendMessage = useCallback(async (text: string) => {
    if (!selectedJid || !text.trim()) return false;

    setSending(true);
    setSendError(null);
    try {
      const res = await fetch('/api/whatsapp/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteJid: selectedJid, message: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errMsg = typeof data.error === 'string'
          ? data.error
          : 'Erro ao enviar mensagem';
        // Tratar erro de numero inexistente
        if (errMsg.includes('exists') || errMsg.includes('false')) {
          setSendError('Numero nao encontrado no WhatsApp. Nao e possivel enviar para este contato.');
        } else {
          setSendError(errMsg);
        }
        return false;
      }

      // Recarregar mensagens apos envio
      await fetchMessages(selectedJid);
      return true;
    } catch (err) {
      setSendError('Erro de conexao ao enviar mensagem');
      return false;
    } finally {
      setSending(false);
    }
  }, [selectedJid, fetchMessages]);

  // Limpar erro de envio
  const clearSendError = useCallback(() => setSendError(null), []);

  // Atualizar manualmente
  const refresh = useCallback(() => {
    fetchChats(true);
    if (selectedJid) {
      fetchMessages(selectedJid, true);
    }
  }, [fetchChats, fetchMessages, selectedJid]);

  // Polling da lista de chats
  useEffect(() => {
    if (!active) {
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
      return;
    }

    fetchChats(true);
    chatIntervalRef.current = setInterval(() => fetchChats(), CHAT_LIST_INTERVAL);

    return () => {
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
    };
  }, [active, fetchChats]);

  // Polling de mensagens da conversa ativa
  useEffect(() => {
    if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);

    if (!active || !selectedJid) return;

    msgIntervalRef.current = setInterval(() => fetchMessages(selectedJid), MESSAGES_INTERVAL);

    return () => {
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    };
  }, [active, selectedJid, fetchMessages]);

  // Buscar nome da conversa selecionada
  const selectedChat = chats.find((c) => c.remoteJid === selectedJid) || null;

  return {
    chats,
    selectedJid,
    selectedChat,
    messages,
    loadingChats,
    loadingMessages,
    sending,
    error,
    sendError,
    clearSendError,
    selectChat,
    deselectChat,
    sendMessage,
    refresh,
  };
}
