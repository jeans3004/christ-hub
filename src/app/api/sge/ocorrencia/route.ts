/**
 * API Route: CRUD de ocorrencias no SGE.
 * POST /api/sge/ocorrencia
 *
 * Aceita action: 'save' | 'get' | 'status' | 'list' e roteia para ocorrenciaClient.
 */

import { NextRequest, NextResponse } from 'next/server';
import { decryptPassword, ocorrenciaClient } from '@/lib/sge';

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
        { error: 'Action obrigatoria: save, get, status ou list' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'save': {
        const { alunoSgeId, motivo, ano, codigo } = body;
        if (!alunoSgeId || !motivo || !ano) {
          return NextResponse.json(
            { error: 'Parametros obrigatorios: alunoSgeId, motivo, ano' },
            { status: 400 }
          );
        }
        const result = await ocorrenciaClient.save(credentials, {
          codigo: codigo || 0,
          alunoSgeId,
          motivo,
          ano,
        });
        return NextResponse.json({ success: result.success, message: result.message });
      }

      case 'get': {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ error: 'Parametro obrigatorio: id' }, { status: 400 });
        }
        const result = await ocorrenciaClient.get(credentials, id);
        return NextResponse.json({ success: true, data: result });
      }

      case 'status': {
        const { id, status } = body;
        if (!id || !status) {
          return NextResponse.json(
            { error: 'Parametros obrigatorios: id, status' },
            { status: 400 }
          );
        }
        const result = await ocorrenciaClient.updateStatus(credentials, { id, status });
        return NextResponse.json({ success: result.success });
      }

      case 'list': {
        const { ano } = body;
        if (!ano) {
          return NextResponse.json({ error: 'Parametro obrigatorio: ano' }, { status: 400 });
        }
        const result = await ocorrenciaClient.fetchAll(credentials, ano);
        return NextResponse.json({ success: true, data: result });
      }

      default:
        return NextResponse.json(
          { error: `Action invalida: ${action}. Use save, get, status ou list` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro SGE';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
