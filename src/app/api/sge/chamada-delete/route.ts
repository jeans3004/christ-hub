/**
 * API Route: Excluir chamada no SGE.
 * POST /api/sge/chamada-delete
 *
 * Remove chamada de uma data/disciplina especifica.
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

    const { serie, turma, turno, disciplina, data } = body;
    if (!serie || !turma || !turno || !disciplina || !data) {
      return NextResponse.json(
        { error: 'Parametros obrigatorios: serie, turma, turno, disciplina, data' },
        { status: 400 }
      );
    }

    const credentials = getCredentials(body);
    const result = await chamadaClient.delete(credentials, {
      serie,
      turma,
      turno,
      disciplina,
      data,
    });

    return NextResponse.json({ success: result.success });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro SGE';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
