/**
 * API Route: Enviar enquete/poll via WhatsApp.
 * POST /api/whatsapp/send-poll
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatPhoneNumber } from '@/services/whatsappService';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'sge-whatsapp';

interface PollPayload {
  name: string;
  selectableCount: number;
  values: string[];
}

interface SendPollRequest {
  destinatarios?: string[];
  groupId?: string;
  poll: PollPayload;
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_API_KEY,
  };
}

async function sendPollToNumber(numero: string, poll: PollPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedNumber = formatPhoneNumber(numero);

    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendPoll/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          number: formattedNumber,
          pollMessage: {
            name: poll.name,
            selectableCount: poll.selectableCount,
            values: poll.values,
          },
          delay: 1200,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error('sendPollToNumber error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar configuracao
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return NextResponse.json(
        { error: 'Evolution API nao configurada' },
        { status: 500 }
      );
    }

    const body: SendPollRequest = await request.json();
    const { destinatarios, groupId, poll } = body;

    // Validacoes
    if (!poll || !poll.name || !poll.values || poll.values.length < 2) {
      return NextResponse.json(
        { error: 'Poll invalido. Necessario nome e pelo menos 2 opcoes' },
        { status: 400 }
      );
    }

    if (!destinatarios?.length && !groupId) {
      return NextResponse.json(
        { error: 'Necessario informar destinatarios ou groupId' },
        { status: 400 }
      );
    }

    // Enviar para grupo
    if (groupId) {
      const result = await sendPollToNumber(groupId, poll);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error, total: 1, enviadas: 0, falhas: 1 },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, total: 1, enviadas: 1, falhas: 0 });
    }

    // Enviar para multiplos destinatarios
    let enviadas = 0;
    let falhas = 0;
    const erros: string[] = [];

    for (const numero of destinatarios!) {
      const result = await sendPollToNumber(numero, poll);
      if (result.success) {
        enviadas++;
      } else {
        falhas++;
        erros.push(`${numero}: ${result.error}`);
      }

      // Delay entre envios para evitar ban
      if (destinatarios!.indexOf(numero) < destinatarios!.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    const total = destinatarios!.length;
    const success = falhas === 0;

    return NextResponse.json({
      success,
      total,
      enviadas,
      falhas,
      ...(erros.length > 0 && { erros }),
    });
  } catch (error) {
    console.error('API /api/whatsapp/send-poll error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
