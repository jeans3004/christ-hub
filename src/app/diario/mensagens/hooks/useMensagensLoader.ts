'use client';

/**
 * Hook para carregar dados da pagina de mensagens.
 * Compativel com Evolution API 2.3.7+
 */

import { useState, useEffect, useCallback } from 'react';
import { Usuario, MensagemLog, TemplateMensagem, GrupoWhatsApp } from '@/types';
import { usuarioService, mensagemLogService, templateMensagemService, grupoWhatsappService } from '@/services/firestore';
import { whatsappService } from '@/services/whatsappService';
import { useUIStore } from '@/store/uiStore';
import {
  Destinatario,
  WhatsAppStatus,
  initialStatus,
  filterUsuariosComCelular,
} from '../types';

interface UseMensagensLoaderReturn {
  // Dados
  destinatarios: Destinatario[];
  historico: MensagemLog[];
  templates: TemplateMensagem[];
  grupos: GrupoWhatsApp[];
  whatsappStatus: WhatsAppStatus;

  // Estados
  loading: boolean;
  loadingHistorico: boolean;
  loadingGrupos: boolean;

  // Acoes
  refreshHistorico: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  refreshGrupos: () => Promise<void>;
  syncGrupos: () => Promise<void>;
}

export function useMensagensLoader(): UseMensagensLoaderReturn {
  // Dados
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [historico, setHistorico] = useState<MensagemLog[]>([]);
  const [templates, setTemplates] = useState<TemplateMensagem[]>([]);
  const [grupos, setGrupos] = useState<GrupoWhatsApp[]>([]);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>(initialStatus);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [loadingGrupos, setLoadingGrupos] = useState(false);

  const { addToast } = useUIStore();

  // Carregar professores com celular
  const loadDestinatarios = useCallback(async () => {
    try {
      const professores = await usuarioService.getProfessoresAtivos();
      const destinatariosComCelular = filterUsuariosComCelular(professores);
      setDestinatarios(destinatariosComCelular);
    } catch (error) {
      console.error('Erro ao carregar destinatarios:', error);
    }
  }, []);

  // Carregar historico
  const loadHistorico = useCallback(async () => {
    setLoadingHistorico(true);
    try {
      const logs = await mensagemLogService.getAll(100);
      setHistorico(logs);
    } catch (error) {
      console.error('Erro ao carregar historico:', error);
    } finally {
      setLoadingHistorico(false);
    }
  }, []);

  // Carregar templates
  const loadTemplates = useCallback(async () => {
    try {
      const data = await templateMensagemService.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  }, []);

  // Carregar status do WhatsApp
  const loadStatus = useCallback(async () => {
    setWhatsappStatus((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch('/api/whatsapp/status');
      const data = await response.json();

      setWhatsappStatus({
        connected: data.connected,
        phoneNumber: data.phoneNumber,
        profileName: data.profileName,
        profilePicUrl: data.profilePicUrl,
        error: data.error,
        loading: false,
      });
    } catch (error) {
      setWhatsappStatus({
        connected: false,
        error: 'Erro ao verificar status',
        loading: false,
      });
    }
  }, []);

  // Carregar grupos do Firestore (cache local)
  const loadGrupos = useCallback(async () => {
    setLoadingGrupos(true);
    try {
      // Primeiro tenta carregar do Firestore (cache)
      const gruposFirestore = await grupoWhatsappService.getAll();
      if (gruposFirestore.length > 0) {
        setGrupos(gruposFirestore);
      } else {
        // Se nao tem cache, carrega da API
        const response = await fetch('/api/whatsapp/groups');
        const data = await response.json();
        if (data.groups) {
          setGrupos(data.groups);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    } finally {
      setLoadingGrupos(false);
    }
  }, []);

  // Sincronizar grupos do WhatsApp para Firestore
  const syncGrupos = useCallback(async () => {
    setLoadingGrupos(true);
    try {
      // Buscar grupos diretamente da Evolution API com retry
      const gruposWhatsApp = await whatsappService.fetchAllGroups();

      if (!gruposWhatsApp.length) {
        addToast('Nenhum grupo encontrado no WhatsApp', 'warning');
        return;
      }

      // Sincronizar com Firestore
      const count = await grupoWhatsappService.syncFromEvolution(gruposWhatsApp);

      // Atualizar estado local
      setGrupos(gruposWhatsApp);

      addToast(`${count} grupo(s) sincronizado(s) com sucesso`, 'success');
    } catch (error) {
      console.error('Erro ao sincronizar grupos:', error);
      addToast('Erro ao sincronizar grupos do WhatsApp', 'error');
      throw error;
    } finally {
      setLoadingGrupos(false);
    }
  }, [addToast]);

  // Carregar dados iniciais
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        loadDestinatarios(),
        loadHistorico(),
        loadTemplates(),
        loadStatus(),
      ]);
      setLoading(false);
    };

    loadAll();
  }, [loadDestinatarios, loadHistorico, loadTemplates, loadStatus]);

  // Polling do status a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  return {
    // Dados
    destinatarios,
    historico,
    templates,
    grupos,
    whatsappStatus,

    // Estados
    loading,
    loadingHistorico,
    loadingGrupos,

    // Acoes
    refreshHistorico: loadHistorico,
    refreshStatus: loadStatus,
    refreshGrupos: loadGrupos,
    syncGrupos,
  };
}
