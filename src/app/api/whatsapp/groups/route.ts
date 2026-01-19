/**
 * API Route: Listar grupos do WhatsApp.
 * GET /api/whatsapp/groups
 */

import { NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';

export async function GET() {
  try {
    const result = await whatsappService.getGroups();

    if (result.error) {
      return NextResponse.json(
        {
          groups: [],
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      groups: result.groups,
      total: result.groups.length,
    });
  } catch (error) {
    console.error('API /api/whatsapp/groups error:', error);
    return NextResponse.json(
      {
        groups: [],
        error: 'Erro ao listar grupos',
      },
      { status: 500 }
    );
  }
}
