/**
 * API Route: Enviar imagem via WhatsApp.
 * POST /api/whatsapp/send-image
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';
import { mensagemLogService } from '@/services/firestore';
import { MensagemLog } from '@/types';

interface SendImageRequest {
  destinatarioId: string;
  destinatarioNome: string;
  numero: string;
  imageBase64: string;
  caption?: string;
  enviadoPorId: string;
  enviadoPorNome: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendImageRequest = await request.json();
    const {
      destinatarioId,
      destinatarioNome,
      numero,
      imageBase64,
      caption,
      enviadoPorId,
      enviadoPorNome,
    } = body;

    console.log('Recebido request send-image:', {
      destinatarioId,
      destinatarioNome,
      numero,
      imageBase64Length: imageBase64?.length || 0,
      caption,
      enviadoPorId,
      enviadoPorNome,
    });

    // Validacoes
    if (!numero) {
      console.log('Erro: numero vazio');
      return NextResponse.json(
        { error: 'Numero do professor e obrigatorio' },
        { status: 400 }
      );
    }

    if (!imageBase64 || imageBase64.length < 100) {
      console.log('Erro: imagem vazia ou muito pequena');
      return NextResponse.json(
        { error: 'Imagem invalida ou vazia' },
        { status: 400 }
      );
    }

    if (!enviadoPorId || !enviadoPorNome) {
      console.log('Erro: dados do remetente vazios', { enviadoPorId, enviadoPorNome });
      return NextResponse.json(
        { error: 'Dados do remetente sao obrigatorios (faca login novamente)' },
        { status: 400 }
      );
    }

    // Criar log inicial com status queued
    const logData: Omit<MensagemLog, 'id' | 'createdAt' | 'updatedAt'> = {
      destinatarioId: destinatarioId || 'manual',
      destinatarioNome: destinatarioNome || 'Desconhecido',
      destinatarioNumero: numero,
      mensagem: caption || '[Imagem do Horario]',
      tipo: 'individual',
      status: 'queued',
      enviadoPorId,
      enviadoPorNome,
      enviadoEm: new Date(),
    };

    let logId: string;
    try {
      logId = await mensagemLogService.create(logData);
    } catch (logError) {
      console.error('Erro ao criar log no Firestore:', logError);
      logId = '';
    }

    // Enviar via Evolution API
    console.log('Enviando imagem para:', numero);
    const result = await whatsappService.sendImage(
      numero,
      { base64: imageBase64, mimetype: 'image/png' },
      caption
    );
    console.log('Resultado do envio:', result);

    // Atualizar log com resultado
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
    console.error('API /api/whatsapp/send-image error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
