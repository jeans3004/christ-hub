/**
 * API Route: Enviar mensagem em conversa de chat.
 * POST /api/whatsapp/chats/send
 * Usa remoteJid direto (ex: 5511999999999@s.whatsapp.net) para evitar
 * reformatacao de numero que pode corromper JIDs.
 */

import { NextRequest, NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'sge-whatsapp';

interface ChatSendRequest {
  remoteJid: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatSendRequest = await request.json();
    const { remoteJid, message } = body;

    if (!remoteJid) {
      return NextResponse.json(
        { error: 'remoteJid e obrigatorio' },
        { status: 400 }
      );
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Mensagem e obrigatoria' },
        { status: 400 }
      );
    }

    // Enviar usando remoteJid diretamente (sem reformatar numero)
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: remoteJid,
          text: message,
          delay: 1200,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.response?.message || errorData.message || `HTTP ${response.status}`;
      console.error('Chat send error:', response.status, JSON.stringify(errorData));
      return NextResponse.json(
        { success: false, error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      messageId: data.key?.id || data.messageId,
    });
  } catch (error) {
    console.error('API /api/whatsapp/chats/send error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
}
