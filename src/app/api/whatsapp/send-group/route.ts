/**
 * API Route: Enviar mensagem para grupo do WhatsApp.
 * POST /api/whatsapp/send-group
 * Compativel com Evolution API 2.3.7+
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';

interface SendGroupRequest {
  groupId: string;
  mensagem?: string;
  message?: string;
  text?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendGroupRequest = await request.json();
    const { groupId } = body;
    // Aceita varios nomes para a mensagem
    const mensagem = body.mensagem || body.message || body.text;

    // Validacoes
    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId e obrigatorio' },
        { status: 400 }
      );
    }

    if (!mensagem) {
      return NextResponse.json(
        { error: 'mensagem e obrigatoria' },
        { status: 400 }
      );
    }

    // Valida formato do groupJid (deve terminar com @g.us)
    if (!groupId.endsWith('@g.us')) {
      return NextResponse.json(
        { error: 'groupId deve estar no formato: 120363...@g.us' },
        { status: 400 }
      );
    }

    // Enviar via Evolution API
    const result = await whatsappService.sendToGroup(groupId, mensagem);

    if (!result.success) {
      // Tratar erro especifico de sessao (bug Baileys/LID - corrigido em 2.3.7)
      if (result.error?.includes('SessionError') || result.error?.includes('No sessions')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Erro de sessao ao enviar para grupo',
            errorType: 'whatsapp-group',
            errorCode: 'SESSION_NO_SESSIONS',
            details: 'Tente reconectar o WhatsApp ou atualize a Evolution API para 2.3.7+',
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
