/**
 * Cliente para Evolution API (WhatsApp).
 * Abstrai todas as chamadas para o servidor Evolution API.
 */

import { GrupoWhatsApp, SendMessageResult } from '@/types';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE || 'sge-diario';

/**
 * Formatar número para padrão internacional brasileiro.
 * Remove caracteres não numéricos e adiciona código do país.
 */
export function formatPhoneNumber(numero: string): string {
  const digits = numero.replace(/\D/g, '');

  // Se já tem 55 e tamanho correto, retorna
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }

  // Remove 55 duplicado se houver
  const cleanDigits = digits.startsWith('55') ? digits.slice(2) : digits;

  // Adiciona 55
  return `55${cleanDigits}`;
}

/**
 * Headers padrão para requisições à Evolution API.
 */
function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_API_KEY,
  };
}

/**
 * Verificar se a API está configurada.
 */
function checkConfig(): void {
  if (!EVOLUTION_API_URL) {
    throw new Error('EVOLUTION_API_URL não configurada');
  }
  if (!EVOLUTION_API_KEY) {
    throw new Error('EVOLUTION_API_KEY não configurada');
  }
}

/**
 * Cliente para Evolution API.
 */
export const whatsappService = {
  /**
   * Enviar mensagem de texto individual.
   */
  async sendText(numero: string, mensagem: string): Promise<SendMessageResult> {
    checkConfig();
    const formattedNumber = formatPhoneNumber(numero);

    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            number: formattedNumber,
            text: mensagem,
            delay: 1200, // 1.2s delay para evitar ban
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || data.messageId,
        status: 'sent',
      };
    } catch (error) {
      console.error('WhatsApp sendText error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Enviar mensagem para grupo.
   */
  async sendToGroup(groupId: string, mensagem: string): Promise<SendMessageResult> {
    checkConfig();

    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            number: groupId,
            text: mensagem,
            delay: 1200,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || data.messageId,
        status: 'sent',
      };
    } catch (error) {
      console.error('WhatsApp sendToGroup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Verificar status da conexão.
   */
  async getStatus(): Promise<{
    connected: boolean;
    phoneNumber?: string;
    profileName?: string;
    profilePicUrl?: string;
    error?: string;
  }> {
    checkConfig();

    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`,
        {
          method: 'GET',
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        return { connected: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      const state = data.state || data.instance?.state;
      const isConnected = state === 'open';

      return {
        connected: isConnected,
        phoneNumber: data.instance?.wuid?.split('@')[0],
        profileName: data.instance?.profileName,
        profilePicUrl: data.instance?.profilePicUrl,
      };
    } catch (error) {
      console.error('WhatsApp getStatus error:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Obter QR Code para conexão/reconexão.
   */
  async getQRCode(): Promise<{ qrcode?: string; pairingCode?: string; error?: string }> {
    checkConfig();

    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`,
        {
          method: 'GET',
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.message || 'Erro ao obter QR Code' };
      }

      const data = await response.json();
      return {
        qrcode: data.qrcode?.base64 || data.base64,
        pairingCode: data.pairingCode,
      };
    } catch (error) {
      console.error('WhatsApp getQRCode error:', error);
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Listar grupos do WhatsApp.
   */
  async getGroups(): Promise<{ groups: GrupoWhatsApp[]; error?: string }> {
    checkConfig();

    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/group/fetchAllGroups/${INSTANCE_NAME}?getParticipants=false`,
        {
          method: 'GET',
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { groups: [], error: errorData.message || 'Erro ao listar grupos' };
      }

      const data = await response.json();
      const groups: GrupoWhatsApp[] = (data || []).map((g: Record<string, unknown>) => ({
        id: g.id as string,
        nome: (g.subject || g.name || 'Sem nome') as string,
        descricao: g.description as string | undefined,
        participantes: (g.size || (g.participants as unknown[])?.length || 0) as number,
        isAdmin: (g.isAdmin || false) as boolean,
        profilePicUrl: g.profilePicUrl as string | undefined,
      }));

      return { groups };
    } catch (error) {
      console.error('WhatsApp getGroups error:', error);
      return {
        groups: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Desconectar instância (logout).
   */
  async disconnect(): Promise<{ success: boolean; error?: string }> {
    checkConfig();

    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/instance/logout/${INSTANCE_NAME}`,
        {
          method: 'DELETE',
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.message || 'Erro ao desconectar' };
      }

      return { success: true };
    } catch (error) {
      console.error('WhatsApp disconnect error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Criar instância se não existir.
   */
  async createInstance(): Promise<{ success: boolean; error?: string }> {
    checkConfig();

    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/instance/create`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            instanceName: INSTANCE_NAME,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Instance já existe não é erro
        if (errorData.message?.includes('already exists')) {
          return { success: true };
        }
        return { success: false, error: errorData.message || 'Erro ao criar instância' };
      }

      return { success: true };
    } catch (error) {
      console.error('WhatsApp createInstance error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Verificar se número existe no WhatsApp.
   */
  async checkNumber(numero: string): Promise<{ exists: boolean; jid?: string; error?: string }> {
    checkConfig();
    const formattedNumber = formatPhoneNumber(numero);

    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/chat/whatsappNumbers/${INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            numbers: [formattedNumber],
          }),
        }
      );

      if (!response.ok) {
        return { exists: false, error: 'Erro ao verificar número' };
      }

      const data = await response.json();
      const result = data?.[0];

      return {
        exists: result?.exists || false,
        jid: result?.jid,
      };
    } catch (error) {
      console.error('WhatsApp checkNumber error:', error);
      return {
        exists: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
