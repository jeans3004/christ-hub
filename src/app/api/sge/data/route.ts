/**
 * API Route: Buscar dados do SGE (disciplinas, alunos).
 * POST /api/sge/data
 *
 * Usado para descobrir disciplinas e alunos de uma serie/turma no SGE.
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

    const { serie, turma, turno, ano } = body;
    if (!serie || !turma || !turno || !ano) {
      return NextResponse.json({ error: 'Serie, turma, turno e ano sao obrigatorios' }, { status: 400 });
    }

    const credentials = getCredentials(body);
    const params = { serie, turma, turno, ano };

    const result: {
      disciplinas?: Array<{ id: number; nome: string }>;
      alunos?: Array<{ id: number; nome: string }>;
    } = {};

    const fetchType: string = body.fetch || 'both';

    if (fetchType === 'disciplinas' || fetchType === 'both') {
      result.disciplinas = await chamadaClient.fetchDisciplinas(credentials, params);
    }

    if (fetchType === 'alunos' || fetchType === 'both') {
      result.alunos = await chamadaClient.fetchStudents(credentials, params);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro SGE';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
