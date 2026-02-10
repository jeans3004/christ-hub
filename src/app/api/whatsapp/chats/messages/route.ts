/**
 * API Route: Buscar mensagens de uma conversa.
 * POST /api/whatsapp/chats/messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';

interface MessagesRequest {
  remoteJid: string;
  limit?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: MessagesRequest = await request.json();
    const { remoteJid, limit = 50 } = body;

    if (!remoteJid) {
      return NextResponse.json(
        { error: 'remoteJid e obrigatorio' },
        { status: 400 }
      );
    }

    const isGroup = remoteJid.endsWith('@g.us');

    // Buscar mensagens e contatos em paralelo para grupos
    const [messages, contacts] = await Promise.all([
      whatsappService.findMessages(remoteJid, limit),
      isGroup ? whatsappService.findContacts() : Promise.resolve([]),
    ]);

    // Montar mapa JID -> nome dos contatos
    const contactMap = new Map<string, string>();
    for (const c of contacts) {
      const jid = c.remoteJid as string | undefined;
      const name = (c.pushName as string) || (c.profileName as string) || '';
      if (jid && name) {
        contactMap.set(jid, name);
      }
    }

    // Normalizar mensagens para o frontend
    const normalized = messages.map((m) => {
      const key = m.key as Record<string, unknown> | undefined;
      const message = m.message as Record<string, unknown> | undefined;

      // Extrair texto da mensagem
      let text = '';
      let mediaType: string | null = null;

      if (message) {
        if (message.conversation) {
          text = message.conversation as string;
        } else if (message.extendedTextMessage) {
          const ext = message.extendedTextMessage as Record<string, unknown>;
          text = (ext.text as string) || '';
        } else if (message.imageMessage) {
          mediaType = 'image';
          text = (message.imageMessage as Record<string, unknown>)?.caption as string || '';
        } else if (message.videoMessage) {
          mediaType = 'video';
          text = (message.videoMessage as Record<string, unknown>)?.caption as string || '';
        } else if (message.audioMessage) {
          mediaType = 'audio';
        } else if (message.documentMessage) {
          mediaType = 'document';
          text = (message.documentMessage as Record<string, unknown>)?.fileName as string || '';
        } else if (message.stickerMessage) {
          mediaType = 'sticker';
        } else if (message.contactMessage) {
          mediaType = 'contact';
          text = (message.contactMessage as Record<string, unknown>)?.displayName as string || '';
        } else if (message.locationMessage) {
          mediaType = 'location';
        }
      }

      // Extrair participante (remetente em grupos)
      const participant = (key?.participant as string) || '';

      // Resolver pushName: usar do msg, senao buscar no mapa de contatos
      let pushName = (m.pushName as string) || '';
      if (!pushName && participant && contactMap.has(participant)) {
        pushName = contactMap.get(participant)!;
      }

      return {
        id: (key?.id as string) || (m.id as string) || '',
        fromMe: (key?.fromMe as boolean) || false,
        remoteJid: (key?.remoteJid as string) || remoteJid,
        text,
        mediaType,
        timestamp: (m.messageTimestamp as number) || 0,
        pushName,
        participant,
        status: (m.status as string) || '',
      };
    }).sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('API /api/whatsapp/chats/messages error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar mensagens' },
      { status: 500 }
    );
  }
}
