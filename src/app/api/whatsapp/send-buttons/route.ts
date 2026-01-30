/**
 * API Route: Enviar mensagem com botoes via WhatsApp.
 * POST /api/whatsapp/send-buttons
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatPhoneNumber } from '@/services/whatsappService';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'sge-whatsapp';

interface ButtonItem {
  type: 'reply';
  displayText: string;
  id: string;
}

interface ButtonPayload {
  title: string;
  description: string;
  footer?: string;
  buttons: ButtonItem[];
}

interface SendButtonsRequest {
  destinatarios?: string[];
  groupId?: string;
  buttonMessage: ButtonPayload;
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_API_KEY,
  };
}

function isValidPhoneNumber(numero: string): boolean {
  const digits = numero.replace(/\D/g, '');
  if (numero.includes('@g.us')) return true;
  return digits.length >= 10 && digits.length <= 15;
}

async function sendButtonsToNumber(
  numero: string,
  payload: ButtonPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isValidPhoneNumber(numero)) {
      console.error(`Numero invalido: ${numero}`);
      return { success: false, error: `Numero invalido` };
    }

    const isGroup = numero.includes('@g.us');
    const formattedNumber = isGroup ? numero : formatPhoneNumber(numero);

    const requestBody = {
      number: formattedNumber,
      title: payload.title,
      description: payload.description,
      footer: payload.footer || '',
      buttons: payload.buttons,
    };

    console.log(`Enviando botoes para ${formattedNumber}:`, {
      title: payload.title,
      buttonsCount: payload.buttons.length,
    });

    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendButtons/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMsg = errorData.response?.message || errorData.message || `HTTP ${response.status}`;
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.flat().join(', ');
      }
      console.error('Evolution API sendButtons error:', response.status, JSON.stringify(errorData, null, 2));
      return { success: false, error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) };
    }

    const result = await response.json();
    console.log('Botoes enviados com sucesso:', result.key?.id);
    return { success: true };
  } catch (error) {
    console.error('sendButtonsToNumber error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!EVOLUTION_API_URL) {
      return NextResponse.json(
        { error: 'Evolution API nao configurada (URL)' },
        { status: 500 }
      );
    }
    if (!EVOLUTION_API_KEY) {
      return NextResponse.json(
        { error: 'Evolution API nao configurada (API Key)' },
        { status: 500 }
      );
    }

    let body: SendButtonsRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Corpo da requisicao invalido' },
        { status: 400 }
      );
    }

    const { destinatarios, groupId, buttonMessage } = body;

    // Validacoes
    if (!buttonMessage || !buttonMessage.title || !buttonMessage.buttons || buttonMessage.buttons.length === 0) {
      return NextResponse.json(
        { error: 'Mensagem de botoes invalida. Necessario titulo e pelo menos 1 botao' },
        { status: 400 }
      );
    }

    if (buttonMessage.buttons.length > 3) {
      return NextResponse.json(
        { error: 'Maximo de 3 botoes permitido' },
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
      const result = await sendButtonsToNumber(groupId, buttonMessage);
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
      const result = await sendButtonsToNumber(numero, buttonMessage);
      if (result.success) {
        enviadas++;
      } else {
        falhas++;
        erros.push(`${numero}: ${result.error}`);
      }

      // Delay entre envios
      if (destinatarios!.indexOf(numero) < destinatarios!.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    const total = destinatarios!.length;

    return NextResponse.json({
      success: falhas === 0,
      total,
      enviadas,
      falhas,
      ...(erros.length > 0 && { erros }),
    });
  } catch (error) {
    console.error('API /api/whatsapp/send-buttons error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
