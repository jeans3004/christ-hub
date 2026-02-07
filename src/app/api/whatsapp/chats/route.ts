/**
 * API Route: Listar conversas do WhatsApp.
 * GET /api/whatsapp/chats
 */

import { NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';

export async function GET() {
  try {
    const chats = await whatsappService.findChats();

    // Normalizar dados para o frontend
    const normalized = chats
      .filter((c) => {
        const id = (c.id as string) || (c.remoteJid as string) || '';
        // Filtrar status@broadcast e grupos (apenas conversas individuais e grupos)
        return id && id !== 'status@broadcast';
      })
      .map((c) => {
        const id = (c.id as string) || (c.remoteJid as string) || '';
        const isGroup = id.endsWith('@g.us');
        const lastMsg = c.lastMessage as Record<string, unknown> | undefined;
        const lastMsgContent = lastMsg?.conversation as string
          || lastMsg?.extendedTextMessage as string
          || (lastMsg?.message as Record<string, unknown>)?.conversation as string
          || '';

        return {
          remoteJid: id,
          name: (c.name as string) || (c.pushName as string) || ((c.contact as Record<string, unknown>)?.name as string) || '',
          isGroup,
          lastMessage: typeof lastMsgContent === 'string' ? lastMsgContent : '',
          lastMessageTimestamp: c.lastMessageTimestamp || c.conversationTimestamp || 0,
          unreadCount: (c.unreadCount as number) || 0,
          profilePicUrl: (c.profilePicUrl as string) || '',
        };
      })
      .sort((a, b) => {
        const tA = Number(a.lastMessageTimestamp) || 0;
        const tB = Number(b.lastMessageTimestamp) || 0;
        return tB - tA;
      });

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('API /api/whatsapp/chats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar conversas' },
      { status: 500 }
    );
  }
}
