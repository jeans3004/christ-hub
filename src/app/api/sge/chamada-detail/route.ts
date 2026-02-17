/**
 * API Route: Detalhe da chamada no SGE (por aluno).
 * POST /api/sge/chamada-detail
 *
 * Retorna lista de alunos com status de presenca e sequencia IDs.
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

    const { serie, turma, turno, disciplina, data, ano } = body;
    if (!serie || !turma || !turno || !disciplina || !data || !ano) {
      return NextResponse.json(
        { error: 'Parametros obrigatorios: serie, turma, turno, disciplina, data, ano' },
        { status: 400 }
      );
    }

    const credentials = getCredentials(body);
    const result = await chamadaClient.fetchDetail(credentials, {
      serie,
      turma,
      turno,
      disciplina,
      data,
      ano,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro SGE';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
