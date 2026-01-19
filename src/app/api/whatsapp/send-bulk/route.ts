/**
 * API Route: Enviar mensagem em massa via WhatsApp.
 * POST /api/whatsapp/send-bulk
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';
import { mensagemLogService } from '@/services/firestore';
import { MensagemLog } from '@/types';

interface Destinatario {
  id: string;
  nome: string;
  numero: string;
}

interface SendBulkRequest {
  destinatarios: Destinatario[];
  mensagem: string;
  enviadoPorId: string;
  enviadoPorNome: string;
  templateId?: string;
}

interface SendResult {
  id: string;
  nome: string;
  success: boolean;
  error?: string;
  logId?: string;
}

// Delay entre mensagens para evitar ban (1.5 segundos)
const DELAY_MS = 1500;

// Limite maximo de destinatarios por requisicao
const MAX_DESTINATARIOS = 100;

export async function POST(request: NextRequest) {
  try {
    const body: SendBulkRequest = await request.json();
    const {
      destinatarios,
      mensagem,
      enviadoPorId,
      enviadoPorNome,
      templateId,
    } = body;

    // Validacoes
    if (!destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0) {
      return NextResponse.json(
        { error: 'Lista de destinatarios e obrigatoria' },
        { status: 400 }
      );
    }

    if (destinatarios.length > MAX_DESTINATARIOS) {
      return NextResponse.json(
        { error: `Maximo de ${MAX_DESTINATARIOS} destinatarios por envio` },
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

    const results: SendResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < destinatarios.length; i++) {
      const dest = destinatarios[i];

      // Validar destinatario
      if (!dest.numero) {
        results.push({
          id: dest.id,
          nome: dest.nome,
          success: false,
          error: 'Numero nao informado',
        });
        failCount++;
        continue;
      }

      // Criar log inicial
      const logData: Omit<MensagemLog, 'id' | 'createdAt' | 'updatedAt'> = {
        destinatarioId: dest.id,
        destinatarioNome: dest.nome,
        destinatarioNumero: dest.numero,
        mensagem,
        tipo: 'broadcast',
        status: 'queued',
        enviadoPorId,
        enviadoPorNome,
        templateId,
        enviadoEm: new Date(),
      };

      const logId = await mensagemLogService.create(logData);

      // Enviar via Evolution API
      const result = await whatsappService.sendText(dest.numero, mensagem);

      // Atualizar log com resultado
      await mensagemLogService.update(logId, {
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        erro: result.error,
      });

      if (result.success) {
        successCount++;
        results.push({
          id: dest.id,
          nome: dest.nome,
          success: true,
          logId,
        });
      } else {
        failCount++;
        results.push({
          id: dest.id,
          nome: dest.nome,
          success: false,
          error: result.error,
          logId,
        });
      }

      // Delay entre mensagens (exceto na ultima)
      if (i < destinatarios.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    return NextResponse.json({
      success: true,
      total: destinatarios.length,
      enviadas: successCount,
      falhas: failCount,
      results,
    });
  } catch (error) {
    console.error('API /api/whatsapp/send-bulk error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
