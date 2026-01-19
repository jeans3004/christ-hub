/**
 * API Route: Enviar mensagem individual via WhatsApp.
 * POST /api/whatsapp/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';
import { mensagemLogService } from '@/services/firestore';
import { MensagemLog } from '@/types';

interface SendRequest {
  destinatarioId: string;
  destinatarioNome: string;
  numero: string;
  mensagem: string;
  enviadoPorId: string;
  enviadoPorNome: string;
  templateId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendRequest = await request.json();
    const {
      destinatarioId,
      destinatarioNome,
      numero,
      mensagem,
      enviadoPorId,
      enviadoPorNome,
      templateId,
    } = body;

    // Validacoes
    if (!numero) {
      return NextResponse.json(
        { error: 'Numero e obrigatorio' },
        { status: 400 }
      );
    }

    if (!mensagem) {
      return NextResponse.json(
        { error: 'Mensagem e obrigatoria' },
        { status: 400 }
      );
    }

    if (!enviadoPorId || !enviadoPorNome) {
      return NextResponse.json(
        { error: 'Dados do remetente sao obrigatorios' },
        { status: 400 }
      );
    }

    // Criar log inicial com status queued
    const logData: Omit<MensagemLog, 'id' | 'createdAt' | 'updatedAt'> = {
      destinatarioId: destinatarioId || 'manual',
      destinatarioNome: destinatarioNome || 'Desconhecido',
      destinatarioNumero: numero,
      mensagem,
      tipo: 'individual',
      status: 'queued',
      enviadoPorId,
      enviadoPorNome,
      templateId,
      enviadoEm: new Date(),
    };

    const logId = await mensagemLogService.create(logData);

    // Enviar via Evolution API
    const result = await whatsappService.sendText(numero, mensagem);

    // Atualizar log com resultado
    await mensagemLogService.update(logId, {
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      erro: result.error,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          logId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      logId,
    });
  } catch (error) {
    console.error('API /api/whatsapp/send error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
