/**
 * API Route: Enviar mensagem para grupo do WhatsApp.
 * POST /api/whatsapp/send-group
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';

interface SendGroupRequest {
  groupId: string;
  mensagem: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendGroupRequest = await request.json();
    const { groupId, mensagem } = body;

    // Validacoes
    if (!groupId) {
      return NextResponse.json(
        { error: 'ID do grupo e obrigatorio' },
        { status: 400 }
      );
    }

    if (!mensagem) {
      return NextResponse.json(
        { error: 'Mensagem e obrigatoria' },
        { status: 400 }
      );
    }

    // Enviar via Evolution API
    const result = await whatsappService.sendToGroup(groupId, mensagem);

    if (!result.success) {
      // Tratar erro específico de sessão (bug conhecido Baileys/LID)
      if (result.error?.includes('SessionError') || result.error?.includes('No sessions')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Envio para grupos temporariamente indisponível',
            errorType: 'whatsapp-group',
            errorCode: 'SESSION_NO_SESSIONS',
            details: 'Limitação conhecida da integração WhatsApp. Mensagens individuais funcionam normalmente.',
          },
          { status: 502 }
        );
      }

      // Outros erros
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          errorType: 'whatsapp',
          errorCode: 'SEND_FAILED',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('API /api/whatsapp/send-group error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        errorType: 'api',
        errorCode: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
