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

function isValidPhoneNumber(numero: string): boolean {
  const digits = numero.replace(/\D/g, '');
  // Número brasileiro: 55 + DDD (2) + número (8 ou 9) = 12-13 dígitos
  // Ou sem 55: DDD (2) + número (8 ou 9) = 10-11 dígitos
  // Grupos: terminam em @g.us
  if (numero.includes('@g.us')) return true;
  return digits.length >= 10 && digits.length <= 15;
}

async function sendPollToNumber(numero: string, poll: PollPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // Validar número antes de formatar
    if (!isValidPhoneNumber(numero)) {
      console.error(`Numero invalido: ${numero} (${numero.length} caracteres)`);
      return { success: false, error: `Numero invalido: ${numero.substring(0, 20)}...` };
    }

    // Não formatar se for ID de grupo (termina em @g.us)
    const isGroup = numero.includes('@g.us');
    const formattedNumber = isGroup ? numero : formatPhoneNumber(numero);

    console.log(`Enviando enquete para ${formattedNumber}:`, {
      name: poll.name,
      optionsCount: poll.values.length,
      selectableCount: poll.selectableCount,
    });

    // Estrutura para Evolution API 2.x - propriedades no nível raiz
    const requestBody = {
      number: formattedNumber,
      name: poll.name,
      selectableCount: poll.selectableCount,
      values: poll.values,
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendPoll/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Extrair mensagem de erro corretamente (pode ser array aninhado)
      let errorMsg = errorData.response?.message || errorData.message || `HTTP ${response.status}`;
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.flat().join(', ');
      }
      console.error('Evolution API sendPoll error:', response.status, JSON.stringify(errorData, null, 2));
      return { success: false, error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) };
    }

    const result = await response.json();
    console.log('Enquete enviada com sucesso:', result.key?.id);
    return { success: true };
  } catch (error) {
    console.error('sendPollToNumber error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar configuracao
    if (!EVOLUTION_API_URL) {
      console.error('EVOLUTION_API_URL nao configurada');
      return NextResponse.json(
        { error: 'Evolution API nao configurada (URL)' },
        { status: 500 }
      );
    }
    if (!EVOLUTION_API_KEY) {
      console.error('EVOLUTION_API_KEY nao configurada');
      return NextResponse.json(
        { error: 'Evolution API nao configurada (API Key)' },
        { status: 500 }
      );
    }

    let body: SendPollRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Erro ao parsear body:', parseError);
      return NextResponse.json(
        { error: 'Corpo da requisicao invalido' },
        { status: 400 }
      );
    }
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
