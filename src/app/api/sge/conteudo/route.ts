/**
 * API Route: CRUD de conteudo no SGE.
 * POST /api/sge/conteudo
 *
 * Aceita action: 'create' | 'edit' | 'delete' | 'get' e roteia para conteudoClient.
 */

import { NextRequest, NextResponse } from 'next/server';
import { decryptPassword, conteudoClient } from '@/lib/sge';

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
    const action: string = body.action;

    if (!action) {
      return NextResponse.json(
        { error: 'Action obrigatoria: create, edit, delete ou get' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create': {
        const { data, aula, serie, turma, turno, disciplina, ano, conteudo } = body;
        if (!data || !serie || !turma || !turno || !disciplina || !ano || !conteudo) {
          return NextResponse.json(
            { error: 'Parametros obrigatorios: data, aula, serie, turma, turno, disciplina, ano, conteudo' },
            { status: 400 }
          );
        }
        const result = await conteudoClient.create(credentials, {
          data, aula: aula || 1, serie, turma, turno, disciplina, ano, conteudo,
        });
        return NextResponse.json({ success: result.success, message: result.message });
      }

      case 'edit': {
        const { sequencia, conteudo } = body;
        if (!sequencia || !conteudo) {
          return NextResponse.json(
            { error: 'Parametros obrigatorios: sequencia, conteudo' },
            { status: 400 }
          );
        }
        const result = await conteudoClient.edit(credentials, { sequencia, conteudo });
        return NextResponse.json({ success: result.success });
      }

      case 'delete': {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ error: 'Parametro obrigatorio: id' }, { status: 400 });
        }
        const result = await conteudoClient.delete(credentials, id);
        return NextResponse.json({ success: result.success });
      }

      case 'get': {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ error: 'Parametro obrigatorio: id' }, { status: 400 });
        }
        const result = await conteudoClient.get(credentials, id);
        return NextResponse.json({ success: true, data: result });
      }

      default:
        return NextResponse.json(
          { error: `Action invalida: ${action}. Use create, edit, delete ou get` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro SGE';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
