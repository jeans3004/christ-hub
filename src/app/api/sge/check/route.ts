/**
 * API Route: Verificar chamadas existentes no SGE.
 * POST /api/sge/check
 *
 * Recebe array de chamadas e verifica quais ja existem no SGE.
 * Login unico, loop sequencial por cada chamada.
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

    const { chamadas } = body;
    if (!chamadas?.length) {
      return NextResponse.json({ error: 'Nenhuma chamada para verificar' }, { status: 400 });
    }

    const credentials = getCredentials(body);
    const results = [];

    for (const chamada of chamadas) {
      try {
        const status = await chamadaClient.checkExists(credentials, {
          serie: chamada.serie,
          turma: chamada.turma,
          turno: chamada.turno,
          ano: chamada.ano,
        });

        results.push({
          data: chamada.data,
          aula: chamada.aula,
          disciplina: chamada.disciplina,
          exists: status.exists,
          presentCount: status.presentIds.length,
        });
      } catch (err) {
        results.push({
          data: chamada.data,
          aula: chamada.aula,
          disciplina: chamada.disciplina,
          exists: false,
          presentCount: 0,
          error: err instanceof Error ? err.message : 'Erro ao verificar',
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro SGE';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
