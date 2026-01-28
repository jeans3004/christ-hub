/**
 * Cliente para Evolution API (WhatsApp).
 * Abstrai todas as chamadas para o servidor Evolution API.
 * Compativel com Evolution API 2.3.7+
 */

import { GrupoWhatsApp, SendMessageResult } from '@/types';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'sge-whatsapp';

// Timeout padrao para Evolution API 2.3.7 (30 segundos)
const DEFAULT_TIMEOUT = 30000;

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
 * Helper para requisicoes com retry e exponential backoff.
 * Recomendado para Evolution API 2.3.7+
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  timeout = DEFAULT_TIMEOUT
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;
      console.error(`[WhatsApp] Tentativa ${attempt}/${maxRetries} falhou:`, (error as Error).message);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Erro desconhecido apos retries');
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
        console.log('Evolution API error:', response.status, JSON.stringify(errorData));

        const errorMessage = errorData.response?.message;
        const errorStr = typeof errorMessage === 'string' ? errorMessage : '';

        // Tratar erro de conexao fechada (pode vir com status 500 ou 400)
        if (errorStr === 'Connection Closed' || errorStr.includes('Connection') || errorStr.includes('closed')) {
          return {
            success: false,
            error: 'WhatsApp desconectado. Escaneie o QR Code novamente.',
          };
        }

        // Tratar erro de numero invalido
        if (Array.isArray(errorMessage) && errorMessage[0]?.exists === false) {
          return {
            success: false,
            error: 'Numero nao existe no WhatsApp',
          };
        }

        // Tratar Internal Server Error da Evolution API
        if (response.status === 500 || errorStr === 'Internal Server Error') {
          return {
            success: false,
            error: 'Erro no servidor WhatsApp. Verifique se a Evolution API esta funcionando corretamente.',
          };
        }

        // Erro generico
        const finalError = errorStr || errorData.error || errorData.message || `Erro HTTP ${response.status}`;
        return {
          success: false,
          error: finalError,
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
        console.log('Evolution API sendToGroup error:', response.status, JSON.stringify(errorData));

        // Extrair mensagem de erro (pode ser string ou array)
        const rawMessage = errorData.response?.message;
        const errorStr = Array.isArray(rawMessage)
          ? rawMessage[0]
          : (typeof rawMessage === 'string' ? rawMessage : '');

        // Tratar erro de sessão (bug Baileys/LID em grupos)
        if (errorStr.includes('SessionError') || errorStr.includes('No sessions')) {
          return {
            success: false,
            error: 'SessionError: No sessions',
          };
        }

        // Tratar erro de conexao fechada
        if (errorStr === 'Connection Closed' || errorStr.includes('Connection') || errorStr.includes('closed')) {
          return {
            success: false,
            error: 'WhatsApp desconectado. Escaneie o QR Code novamente.',
          };
        }

        // Tratar Internal Server Error da Evolution API
        if (response.status === 500 || errorStr === 'Internal Server Error') {
          return {
            success: false,
            error: 'Erro no servidor WhatsApp. Verifique se a Evolution API esta funcionando corretamente.',
          };
        }

        // Erro generico
        const finalError = errorStr || errorData.error || errorData.message || `Erro HTTP ${response.status}`;
        return {
          success: false,
          error: finalError,
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
   * Retorna status detalhado diferenciando erro de rede vs instância desconectada.
   */
  async getStatus(): Promise<{
    connected: boolean;
    phoneNumber?: string;
    profileName?: string;
    profilePicUrl?: string;
    connectionState?: string;
    error?: string;
    errorType?: 'network' | 'api' | 'instance';
    errorCode?: string;
  }> {
    checkConfig();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(
        `${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`,
        {
          method: 'GET',
          headers: getHeaders(),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        return {
          connected: false,
          error: `Erro da Evolution API: HTTP ${response.status}`,
          errorType: 'api',
          errorCode: `HTTP_${response.status}`,
          connectionState: 'error',
        };
      }

      const data = await response.json();
      const state = data.state || data.instance?.state;
      const isConnected = state === 'open';

      return {
        connected: isConnected,
        connectionState: state || 'unknown',
        phoneNumber: data.instance?.wuid?.split('@')[0],
        profileName: data.instance?.profileName,
        profilePicUrl: data.instance?.profilePicUrl,
        ...((!isConnected && state) && {
          error: `WhatsApp ${state === 'close' ? 'desconectado' : state}`,
          errorType: 'instance',
          errorCode: state,
        }),
      };
    } catch (error) {
      const err = error as Error & { code?: string; cause?: { code?: string } };
      const code = err.code || err.cause?.code || 'UNKNOWN';

      // Identificar tipo de erro de rede
      let errorMessage = 'Erro desconhecido';
      if (code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Evolution API offline (conexão recusada)';
      } else if (code === 'EHOSTUNREACH' || err.message?.includes('EHOSTUNREACH')) {
        errorMessage = 'Evolution API inacessível (host unreachable)';
      } else if (code === 'ETIMEDOUT' || err.message?.includes('ETIMEDOUT')) {
        errorMessage = 'Evolution API não respondeu (timeout)';
      } else if (err.name === 'AbortError') {
        errorMessage = 'Evolution API não respondeu em 10s (timeout)';
      } else if (err.message?.includes('fetch failed')) {
        errorMessage = 'Falha de conexão com Evolution API';
      } else {
        errorMessage = err.message || 'Erro de conexão';
      }

      console.error('WhatsApp getStatus error:', code, err.message);

      return {
        connected: false,
        connectionState: 'offline',
        error: errorMessage,
        errorType: 'network',
        errorCode: code,
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

      // Ler resposta como texto primeiro (API pode retornar vazio se não há grupos)
      const text = await response.text();

      if (!response.ok) {
        let errorMessage = 'Erro ao listar grupos';
        if (text && text.trim()) {
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          } catch {
            // Ignora erro de parse
          }
        }
        return { groups: [], error: errorMessage };
      }

      // Parsear JSON com tratamento de resposta vazia
      let data: Record<string, unknown>[] = [];
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          console.warn('WhatsApp getGroups: resposta nao e JSON valido');
          return { groups: [], error: 'Resposta invalida da API' };
        }
      }

      // Garantir que data seja um array
      if (!Array.isArray(data)) {
        console.warn('WhatsApp getGroups: resposta nao e um array', data);
        return { groups: [] };
      }

      const groups: GrupoWhatsApp[] = data.map((g: Record<string, unknown>) => ({
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
   * Busca todos os grupos da instancia (com retry).
   * Compativel com Evolution API 2.3.7+
   */
  async fetchAllGroups(): Promise<GrupoWhatsApp[]> {
    checkConfig();

    try {
      const response = await fetchWithRetry<Record<string, unknown>[] | { groups?: Record<string, unknown>[] }>(
        `${EVOLUTION_API_URL}/group/fetchAllGroups/${INSTANCE_NAME}`,
        {
          method: 'GET',
          headers: getHeaders(),
        }
      );

      // Normalizar resposta (pode vir como array direto ou dentro de objeto)
      const data = Array.isArray(response) ? response : (response?.groups || []);

      return data.map((g: Record<string, unknown>) => ({
        id: g.id as string,
        nome: (g.subject || g.name || 'Sem nome') as string,
        descricao: g.description as string | undefined,
        participantes: (g.size || (g.participants as unknown[])?.length || 0) as number,
        isAdmin: (g.isAdmin || false) as boolean,
        profilePicUrl: g.profilePicUrl as string | undefined,
      }));
    } catch (error) {
      console.error('WhatsApp fetchAllGroups error:', error);
      throw error;
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

  /**
   * Enviar imagem.
   */
  async sendImage(
    numero: string,
    media: { base64?: string; url?: string; mimetype?: string },
    caption?: string
  ): Promise<SendMessageResult> {
    checkConfig();
    const formattedNumber = formatPhoneNumber(numero);

    try {
      // Evolution API 2.x espera base64 com prefixo data URI
      let mediaContent = media.base64 || '';
      if (media.base64 && !media.base64.startsWith('data:')) {
        mediaContent = `data:${media.mimetype || 'image/png'};base64,${media.base64}`;
      }

      // Estrutura para Evolution API 2.x
      const body: Record<string, unknown> = {
        number: formattedNumber,
        mediatype: 'image',
        mimetype: media.mimetype || 'image/png',
        caption: caption || '',
        media: mediaContent || undefined,
        mediaurl: !mediaContent ? media.url : undefined,
        delay: 1200,
      };

      // Remover campos undefined
      Object.keys(body).forEach(key => {
        if (body[key] === undefined) delete body[key];
      });

      console.log('Enviando imagem para Evolution API:', {
        number: formattedNumber,
        mediaLength: mediaContent.length,
        hasCaption: !!caption,
        mediatype: 'image',
      });

      const response = await fetch(
        `${EVOLUTION_API_URL}/message/sendMedia/${INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Evolution API sendImage error:', response.status, JSON.stringify(errorData));
        const errorMsg = errorData.response?.message || errorData.message || `HTTP ${response.status}`;
        return { success: false, error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || data.messageId,
        status: 'sent',
      };
    } catch (error) {
      console.error('WhatsApp sendImage error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Enviar documento (PDF, DOC, XLS, etc).
   */
  async sendDocument(
    numero: string,
    media: { base64?: string; url?: string; filename?: string; mimetype?: string },
    caption?: string
  ): Promise<SendMessageResult> {
    checkConfig();
    const formattedNumber = formatPhoneNumber(numero);

    try {
      const body: Record<string, unknown> = {
        number: formattedNumber,
        mediaMessage: {
          mediatype: 'document',
          ...(media.base64 ? { media: media.base64 } : { mediaurl: media.url }),
          ...(media.filename && { fileName: media.filename }),
          ...(media.mimetype && { mimetype: media.mimetype }),
          ...(caption && { caption }),
        },
        delay: 1200,
      };

      const response = await fetch(
        `${EVOLUTION_API_URL}/message/sendMedia/${INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.message || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || data.messageId,
        status: 'sent',
      };
    } catch (error) {
      console.error('WhatsApp sendDocument error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Enviar áudio.
   */
  async sendAudio(
    numero: string,
    media: { base64?: string; url?: string; mimetype?: string }
  ): Promise<SendMessageResult> {
    checkConfig();
    const formattedNumber = formatPhoneNumber(numero);

    try {
      const body: Record<string, unknown> = {
        number: formattedNumber,
        mediaMessage: {
          mediatype: 'audio',
          ...(media.base64 ? { media: media.base64 } : { mediaurl: media.url }),
          ...(media.mimetype && { mimetype: media.mimetype }),
        },
        delay: 1200,
      };

      const response = await fetch(
        `${EVOLUTION_API_URL}/message/sendMedia/${INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.message || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || data.messageId,
        status: 'sent',
      };
    } catch (error) {
      console.error('WhatsApp sendAudio error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Enviar vídeo.
   */
  async sendVideo(
    numero: string,
    media: { base64?: string; url?: string; mimetype?: string },
    caption?: string
  ): Promise<SendMessageResult> {
    checkConfig();
    const formattedNumber = formatPhoneNumber(numero);

    try {
      const body: Record<string, unknown> = {
        number: formattedNumber,
        mediaMessage: {
          mediatype: 'video',
          ...(media.base64 ? { media: media.base64 } : { mediaurl: media.url }),
          ...(media.mimetype && { mimetype: media.mimetype }),
          ...(caption && { caption }),
        },
        delay: 1200,
      };

      const response = await fetch(
        `${EVOLUTION_API_URL}/message/sendMedia/${INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.message || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || data.messageId,
        status: 'sent',
      };
    } catch (error) {
      console.error('WhatsApp sendVideo error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Enviar localização.
   */
  async sendLocation(
    numero: string,
    location: { latitude: number; longitude: number; name?: string; address?: string }
  ): Promise<SendMessageResult> {
    checkConfig();
    const formattedNumber = formatPhoneNumber(numero);

    try {
      const body: Record<string, unknown> = {
        number: formattedNumber,
        locationMessage: {
          latitude: location.latitude,
          longitude: location.longitude,
          ...(location.name && { name: location.name }),
          ...(location.address && { address: location.address }),
        },
        delay: 1200,
      };

      const response = await fetch(
        `${EVOLUTION_API_URL}/message/sendLocation/${INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.message || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || data.messageId,
        status: 'sent',
      };
    } catch (error) {
      console.error('WhatsApp sendLocation error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Enviar cartão de contato.
   */
  async sendContact(
    numero: string,
    contact: { name: string; phone: string }
  ): Promise<SendMessageResult> {
    checkConfig();
    const formattedNumber = formatPhoneNumber(numero);

    try {
      const body: Record<string, unknown> = {
        number: formattedNumber,
        contactMessage: [{
          fullName: contact.name,
          wuid: formatPhoneNumber(contact.phone),
          phoneNumber: contact.phone,
        }],
        delay: 1200,
      };

      const response = await fetch(
        `${EVOLUTION_API_URL}/message/sendContact/${INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.message || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || data.messageId,
        status: 'sent',
      };
    } catch (error) {
      console.error('WhatsApp sendContact error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Enviar sticker (figurinha).
   */
  async sendSticker(
    numero: string,
    media: { base64?: string; url?: string }
  ): Promise<SendMessageResult> {
    checkConfig();
    const formattedNumber = formatPhoneNumber(numero);

    try {
      const body: Record<string, unknown> = {
        number: formattedNumber,
        stickerMessage: {
          ...(media.base64 ? { image: media.base64 } : { image: media.url }),
        },
        delay: 1200,
      };

      const response = await fetch(
        `${EVOLUTION_API_URL}/message/sendSticker/${INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.message || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || data.messageId,
        status: 'sent',
      };
    } catch (error) {
      console.error('WhatsApp sendSticker error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
};
