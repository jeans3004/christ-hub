/**
 * API Route: Verificar chamadas existentes no e-aluno.
 * POST /api/ealuno/check
 *
 * Recebe array de chamadas e verifica quais ja existem no SGE.
 * Login unico, loop sequencial por cada chamada.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  eAlunoLogin,
  eAlunoFetchChamadaStatus,
  decryptPassword,
} from '@/lib/eAlunoProxy';

interface CheckChamadaItem {
  serie: number;
  turma: number;
  turno: string;
  disciplina: number;
  ano: number;
  data: string;     // YYYY-MM-DD
  aula: number;
}

interface CheckRequest {
  user: string;
  password: string;
  encrypted?: boolean;
  chamadas: CheckChamadaItem[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckRequest = await request.json();
    const { user, chamadas } = body;

    if (!user || !body.password) {
      return NextResponse.json({ error: 'Credenciais obrigatorias' }, { status: 400 });
    }

    if (!chamadas?.length) {
      return NextResponse.json({ error: 'Nenhuma chamada para verificar' }, { status: 400 });
    }

    const password = body.encrypted ? decryptPassword(body.password) : body.password;
    const session = await eAlunoLogin(user, password);

    const results = [];

    for (const chamada of chamadas) {
      try {
        const status = await eAlunoFetchChamadaStatus(session, {
          serie: chamada.serie,
          turma: chamada.turma,
          turno: chamada.turno,
          ano: chamada.ano,
          data: chamada.data,
          disciplina: chamada.disciplina,
          aula: chamada.aula,
        });

        results.push({
          data: chamada.data,
          aula: chamada.aula,
          disciplina: chamada.disciplina,
          exists: status.exists,
          presentCount: status.presentIds.length,
        });
      } catch (error) {
        results.push({
          data: chamada.data,
          aula: chamada.aula,
          disciplina: chamada.disciplina,
          exists: false,
          presentCount: 0,
          error: error instanceof Error ? error.message : 'Erro ao verificar',
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao verificar chamadas no e-aluno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
