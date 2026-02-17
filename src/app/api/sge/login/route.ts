/**
 * API Route: Login no SGE e buscar opcoes disponiveis.
 * POST /api/sge/login
 *
 * Recebe credenciais, loga no SGE, e retorna opcoes do dropdown (serie+turma+turno).
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

    const credentials = getCredentials(body);
    const options = await chamadaClient.fetchPageOptions(credentials);

    return NextResponse.json({
      success: true,
      data: { options },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro SGE';
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message === 'Credenciais invalidas' ? 401 : 500 }
    );
  }
}
