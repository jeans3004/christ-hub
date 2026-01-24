/**
 * API Route para acessar Google Sheets.
 * Usa o token OAuth do Drive para ler planilhas.
 */

import { NextRequest, NextResponse } from 'next/server';

// GET /api/google/sheets?spreadsheetId=XXX&range=A:Z
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const spreadsheetId = searchParams.get('spreadsheetId');
  const range = searchParams.get('range') || 'A:Z';
  const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Token de acesso não fornecido' },
      { status: 401 }
    );
  }

  if (!spreadsheetId) {
    return NextResponse.json(
      { error: 'ID da planilha não fornecido' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `Erro ${response.status}`;

      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Sem permissão para acessar esta planilha. Verifique se a planilha está compartilhada.' },
          { status: 403 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Planilha não encontrada. Verifique a URL.' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: `Erro ao acessar planilha: ${errorMessage}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao acessar Google Sheets:', error);
    return NextResponse.json(
      { error: 'Erro interno ao acessar planilha' },
      { status: 500 }
    );
  }
}
