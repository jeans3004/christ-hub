/**
 * API Route: Buscar dados do e-aluno (disciplinas, alunos).
 * POST /api/ealuno/data
 *
 * Usado para descobrir disciplinas e alunos de uma serie/turma no e-aluno.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  eAlunoLogin,
  eAlunoFetchDisciplinas,
  eAlunoFetchStudents,
  decryptPassword,
} from '@/lib/eAlunoProxy';

interface DataRequest {
  // Credentials (either plain or encrypted)
  user: string;
  password: string;
  encrypted?: boolean;
  // E-aluno params
  serie: number;
  turma: number;
  turno: string;
  ano: number;
  // What to fetch
  fetch: 'disciplinas' | 'alunos' | 'both';
}

export async function POST(request: NextRequest) {
  try {
    const body: DataRequest = await request.json();
    const { user, serie, turma, turno, ano } = body;

    if (!user || !body.password) {
      return NextResponse.json({ error: 'Credenciais obrigatorias' }, { status: 400 });
    }
    if (!serie || !turma || !turno || !ano) {
      return NextResponse.json({ error: 'Serie, turma, turno e ano sao obrigatorios' }, { status: 400 });
    }

    const password = body.encrypted ? decryptPassword(body.password) : body.password;
    const session = await eAlunoLogin(user, password);

    const result: {
      disciplinas?: Array<{ id: number; nome: string }>;
      alunos?: Array<{ id: number; nome: string }>;
    } = {};

    if (body.fetch === 'disciplinas' || body.fetch === 'both') {
      result.disciplinas = await eAlunoFetchDisciplinas(session, serie, turma, turno, ano);
    }

    if (body.fetch === 'alunos' || body.fetch === 'both') {
      result.alunos = await eAlunoFetchStudents(session, serie, turma, turno, ano);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar dados do e-aluno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
