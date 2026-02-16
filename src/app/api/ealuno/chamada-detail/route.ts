/**
 * API Route: Detalhe da chamada no e-aluno (por aluno).
 * POST /api/ealuno/chamada-detail
 *
 * Retorna lista de alunos com status de presenca para uma chamada especifica.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  eAlunoLogin,
  eAlunoFetchChamadaDetail,
  decryptPassword,
} from '@/lib/eAlunoProxy';

interface ChamadaDetailRequest {
  user: string;
  password: string;
  encrypted?: boolean;
  serie: number;
  turma: number;
  turno: string;
  disciplina: number;
  ano: number;
  data: string;     // YYYY-MM-DD
  aula: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChamadaDetailRequest = await request.json();
    const { user, serie, turma, turno, disciplina, ano, data, aula } = body;

    if (!user || !body.password) {
      return NextResponse.json({ error: 'Credenciais obrigatorias' }, { status: 400 });
    }

    if (!serie || !turma || !turno || !disciplina || !ano || !data || !aula) {
      return NextResponse.json({ error: 'Parametros obrigatorios: serie, turma, turno, disciplina, ano, data, aula' }, { status: 400 });
    }

    const password = body.encrypted ? decryptPassword(body.password) : body.password;
    const session = await eAlunoLogin(user, password);

    const result = await eAlunoFetchChamadaDetail(session, {
      serie,
      turma,
      turno,
      ano,
      data,
      disciplina,
      aula,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar detalhe da chamada no e-aluno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
