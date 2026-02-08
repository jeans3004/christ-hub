/**
 * API Route: Obter QR Code para conexao/reconexao WhatsApp.
 * GET /api/whatsapp/qrcode
 */

import { NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';

export async function GET() {
  try {
    // Primeiro verificar se ja esta conectado
    const status = await whatsappService.getStatus();

    if (status.connected) {
      return NextResponse.json({
        connected: true,
        message: 'WhatsApp ja esta conectado',
        phoneNumber: status.phoneNumber,
        profileName: status.profileName,
      });
    }

    // Garantir syncFullHistory na instancia
    await whatsappService.updateInstanceSettings().catch(() => {});

    // Se nao esta conectado, obter QR Code
    const result = await whatsappService.getQRCode();

    if (result.error) {
      return NextResponse.json(
        {
          connected: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connected: false,
      qrcode: result.qrcode,
      pairingCode: result.pairingCode,
    });
  } catch (error) {
    console.error('API /api/whatsapp/qrcode error:', error);
    return NextResponse.json(
      {
        connected: false,
        error: 'Erro ao obter QR Code',
      },
      { status: 500 }
    );
  }
}
