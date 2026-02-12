/**
 * API Route: Testar login no e-aluno e buscar dados disponiveis.
 * POST /api/ealuno/login
 *
 * Recebe credenciais, loga no e-aluno, e retorna opcoes do dropdown combinado (serie+turma+turno).
 */

import { NextRequest, NextResponse } from 'next/server';
import { eAlunoLogin, eAlunoFetchPageData } from '@/lib/eAlunoProxy';

interface LoginRequest {
  user: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { user, password } = body;

    if (!user || !password) {
      return NextResponse.json(
        { error: 'Usuario e senha sao obrigatorios' },
        { status: 400 }
      );
    }

    // Login to e-aluno
    const session = await eAlunoLogin(user, password);

    // Fetch page data (combined serie+turma+turno options)
    const pageData = await eAlunoFetchPageData(session);

    return NextResponse.json({
      success: true,
      data: {
        options: pageData.options,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao conectar ao e-aluno';
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message === 'Credenciais invalidas' ? 401 : 500 }
    );
  }
}
