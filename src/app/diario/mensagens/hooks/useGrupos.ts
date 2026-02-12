/**
 * Hook para gerenciar grupos do WhatsApp.
 */

import { useState, useEffect, useCallback } from 'react';
import { GrupoWhatsApp } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { MediaData } from '../types';

interface UseGruposReturn {
  grupos: GrupoWhatsApp[];
  loading: boolean;
  error: string | null;
  refreshGrupos: () => Promise<void>;
  sendToGroup: (groupId: string, mensagem: string) => Promise<{ success: boolean; error?: string }>;
  sendMediaToGroup: (groupId: string, media: MediaData, caption?: string) => Promise<{ success: boolean; error?: string }>;
  sending: boolean;
}

export function useGrupos(): UseGruposReturn {
  const { usuario } = useAuthStore();
  const [grupos, setGrupos] = useState<GrupoWhatsApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const getDisplayName = (nome: string): string => {
    if (nome.toUpperCase().includes('COORDENACAO PEDAGOGICA') || nome.toUpperCase().includes('COORDENAÇÃO PEDAGÓGICA')) {
      return 'Coordenador Pedagógico Carlos Cruz';
    }
    return nome;
  };
  const nomeHeader = usuario?.nome ? `*${getDisplayName(usuario.nome)}*:\n` : '';

  const fetchGrupos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/groups');

      // Tentar parsear JSON com tratamento de erro robusto
      let data: { groups: GrupoWhatsApp[]; error?: string } = { groups: [] };
      try {
        const text = await response.text();
        if (text && text.trim()) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.warn('Erro ao parsear resposta JSON:', parseError);
        data = { groups: [], error: 'Resposta invalida do servidor' };
      }

      if (!response.ok) {
        setError(data.error || 'Erro ao carregar grupos');
        setGrupos([]);
        return;
      }

      setGrupos(data.groups || []);
    } catch (err) {
      console.error('Erro ao carregar grupos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendToGroup = useCallback(async (groupId: string, mensagem: string) => {
    setSending(true);
    try {
      const response = await fetch('/api/whatsapp/send-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          mensagem: nomeHeader + mensagem,
        }),
      });

      // Tentar parsear JSON com tratamento de erro robusto
      let data: { error?: string } = {};
      try {
        const text = await response.text();
        if (text && text.trim()) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.warn('Erro ao parsear resposta JSON:', parseError);
        data = { error: 'Resposta invalida do servidor' };
      }

      if (!response.ok) {
        return { success: false, error: data.error || 'Erro ao enviar mensagem' };
      }

      return { success: true };
    } catch (err) {
      console.error('Erro ao enviar para grupo:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    } finally {
      setSending(false);
    }
  }, [nomeHeader]);

  const sendMediaToGroup = useCallback(async (groupId: string, media: MediaData, caption?: string) => {
    setSending(true);
    try {
      const response = await fetch('/api/whatsapp/send-group-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          mediaType: media.type,
          mediaBase64: media.base64,
          mediaUrl: media.url,
          filename: media.filename,
          mimetype: media.mimetype,
          caption: caption ? nomeHeader + caption : nomeHeader.trim(),
        }),
      });

      let data: { error?: string } = {};
      try {
        const text = await response.text();
        if (text && text.trim()) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.warn('Erro ao parsear resposta JSON:', parseError);
        data = { error: 'Resposta invalida do servidor' };
      }

      if (!response.ok) {
        return { success: false, error: data.error || 'Erro ao enviar mídia' };
      }

      return { success: true };
    } catch (err) {
      console.error('Erro ao enviar mídia para grupo:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    } finally {
      setSending(false);
    }
  }, [nomeHeader]);

  useEffect(() => {
    fetchGrupos();
  }, [fetchGrupos]);

  return {
    grupos,
    loading,
    error,
    refreshGrupos: fetchGrupos,
    sendToGroup,
    sendMediaToGroup,
    sending,
  };
}
