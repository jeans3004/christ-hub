/**
 * API Route: Relatorios do SGE.
 * POST /api/sge/relatorio
 *
 * Aceita tipo: 'detalhamento_dia' | 'detalhamento_mensal' | 'proxied' e retorna HTML.
 */

import { NextRequest, NextResponse } from 'next/server';
import { decryptPassword, relatorioClient } from '@/lib/sge';

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
    const tipo: string = body.tipo;

    if (!tipo) {
      return NextResponse.json(
        { error: 'Tipo obrigatorio: detalhamento_dia, detalhamento_mensal ou proxied' },
        { status: 400 }
      );
    }

    const { serie, turma, turno, ano } = body;
    if (!serie || !turma || !turno || !ano) {
      return NextResponse.json(
        { error: 'Parametros obrigatorios: serie, turma, turno, ano' },
        { status: 400 }
      );
    }

    const params = {
      serie,
      turma,
      turno,
      ano,
      disciplina: body.disciplina,
      data: body.data,
      mes: body.mes,
      txtMes: body.txtMes,
      txtSerie: body.txtSerie,
      txtDisciplina: body.txtDisciplina,
    };

    let html: string;

    switch (tipo) {
      case 'detalhamento_dia': {
        if (!body.disciplina || !body.data) {
          return NextResponse.json(
            { error: 'Parametros obrigatorios para detalhamento_dia: disciplina, data' },
            { status: 400 }
          );
        }
        html = await relatorioClient.fetchDetalhamentoDia(credentials, params);
        break;
      }

      case 'detalhamento_mensal': {
        if (!body.disciplina || !body.mes) {
          return NextResponse.json(
            { error: 'Parametros obrigatorios para detalhamento_mensal: disciplina, mes' },
            { status: 400 }
          );
        }
        html = await relatorioClient.fetchDetalhamentoMensal(credentials, params);
        break;
      }

      case 'proxied': {
        const subtipo = body.subtipo as 'faltas' | 'analise_anual' | 'assinatura' | 'listagem_assinatura';
        if (!subtipo) {
          return NextResponse.json(
            { error: 'Parametro obrigatorio para proxied: subtipo (faltas, analise_anual, assinatura, listagem_assinatura)' },
            { status: 400 }
          );
        }
        html = await relatorioClient.fetchProxiedReport(credentials, subtipo, {
          ...params,
          titulo: body.titulo,
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: `Tipo invalido: ${tipo}. Use detalhamento_dia, detalhamento_mensal ou proxied` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: { html } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro SGE';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
