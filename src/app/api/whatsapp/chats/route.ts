/**
 * API Route: Listar conversas do WhatsApp.
 * GET /api/whatsapp/chats
 */

import { NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';

export async function GET() {
  try {
    // Buscar chats e contatos em paralelo
    const [chats, contacts] = await Promise.all([
      whatsappService.findChats(),
      whatsappService.findContacts(),
    ]);

    // Criar mapa de contatos: remoteJid -> {name, profilePicUrl}
    const contactMap = new Map<string, { name: string; profilePicUrl: string }>();
    for (const c of contacts) {
      const jid = (c.remoteJid as string) || (c.id as string) || '';
      const name = (c.pushName as string) || (c.name as string) || '';
      const pic = (c.profilePicUrl as string) || '';
      if (jid && name) {
        contactMap.set(jid, { name, profilePicUrl: pic });
      }
    }

    // Normalizar dados para o frontend
    // Evolution API 2.x retorna `id` como CUID do banco e `remoteJid` como JID real
    const isValidJid = (jid: string) =>
      jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us') || jid.endsWith('@lid');

    const normalized = chats
      .filter((c) => {
        const jid = (c.remoteJid as string) || (c.id as string) || '';
        return jid && isValidJid(jid) && jid !== 'status@broadcast';
      })
      .map((c) => {
        const jid = (c.remoteJid as string) || (c.id as string) || '';
        const isGroup = jid.endsWith('@g.us');
        const lastMsg = c.lastMessage as Record<string, unknown> | undefined;
        const lastMsgMessage = lastMsg?.message as Record<string, unknown> | undefined;
        const lastMsgContent = lastMsg?.conversation as string
          || lastMsg?.extendedTextMessage as string
          || lastMsgMessage?.conversation as string
          || '';

        // Nome: tentar do chat, depois do mapa de contatos
        let name = (c.name as string) || (c.pushName as string) || ((c.contact as Record<string, unknown>)?.name as string) || '';
        let profilePicUrl = (c.profilePicUrl as string) || '';

        if (!name || !profilePicUrl) {
          const contact = contactMap.get(jid);
          if (contact) {
            if (!name) name = contact.name;
            if (!profilePicUrl) profilePicUrl = contact.profilePicUrl;
          }
        }

        return {
          remoteJid: jid,
          name,
          isGroup,
          lastMessage: typeof lastMsgContent === 'string' ? lastMsgContent : '',
          lastMessageTimestamp: c.lastMessageTimestamp || c.conversationTimestamp || (lastMsg?.messageTimestamp as number) || 0,
          unreadCount: (c.unreadCount as number) || 0,
          profilePicUrl,
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
