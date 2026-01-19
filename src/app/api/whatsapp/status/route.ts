/**
 * API Route: Verificar status da conexao WhatsApp.
 * GET /api/whatsapp/status
 */

import { NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';

export async function GET() {
  try {
    const status = await whatsappService.getStatus();

    return NextResponse.json({
      connected: status.connected,
      phoneNumber: status.phoneNumber,
      profileName: status.profileName,
      profilePicUrl: status.profilePicUrl,
      error: status.error,
    });
  } catch (error) {
    console.error('API /api/whatsapp/status error:', error);
    return NextResponse.json(
      {
        connected: false,
        error: 'Erro ao verificar status',
      },
      { status: 500 }
    );
  }
}
