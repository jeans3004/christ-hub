/**
 * API Route: Editar presenca individual no SGE.
 * POST /api/sge/chamada-edit
 *
 * Altera status de presenca de um aluno (P/F) usando o ID sequencia.
 */

import { NextRequest, NextResponse } from 'next/server';
import { decryptPassword, chamadaClient } from '@/lib/sge';

function getCredentials(body: { user: string; password: string; encrypted?: boolean }) {
  const password = body.encrypted ? decryptPassword(body.password) : body.password;
  return { user: body.user, password };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.user || !body.password) {
      return NextResponse.json({ error: 'Credenciais obrigatorias' }, { status: 400 });
    }

    const { parametro, sequencia } = body;
    if (!parametro || !sequencia) {
      return NextResponse.json(
        { error: 'Parametros obrigatorios: parametro ("." ou "F") e sequencia' },
        { status: 400 }
      );
    }

    if (parametro !== '.' && parametro !== 'F') {
      return NextResponse.json(
        { error: 'Parametro deve ser "." (presente) ou "F" (falta)' },
        { status: 400 }
      );
    }

    const credentials = getCredentials(body);
    const result = await chamadaClient.edit(credentials, { parametro, sequencia });

    return NextResponse.json({ success: result.success });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro SGE';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
