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
      enviadoEm: new Date(),
      // Adicionar templateId apenas se definido (Firebase não aceita undefined)
      ...(templateId && { templateId }),
    };

    let logId: string;
    try {
      logId = await mensagemLogService.create(logData);
    } catch (logError) {
      console.error('Erro ao criar log no Firestore:', logError);
      // Continuar sem log - nao bloquear o envio
      logId = '';
    }

    // Enviar via Evolution API
    console.log('Enviando mensagem para:', numero);
    const result = await whatsappService.sendText(numero, mensagem);
    console.log('Resultado do envio:', result);

    // Atualizar log com resultado (remover campos undefined)
    if (logId) {
      const updateData: Record<string, unknown> = {
        status: result.success ? 'sent' : 'failed',
      };
      if (result.messageId) updateData.messageId = result.messageId;
      if (result.error) updateData.erro = result.error;

      try {
        await mensagemLogService.update(logId, updateData);
      } catch (updateError) {
        console.error('Erro ao atualizar log:', updateError);
      }
    }

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
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
