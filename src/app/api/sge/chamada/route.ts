/**
 * API Route: Registrar chamada no SGE.
 * POST /api/sge/chamada
 *
 * Recebe dados da chamada do Luminar e registra no SGE.
 * Suporta 3 modos: presentStudentIds, alunoMap+presencas, ou absentStudentIds.
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

    const { serie, turma, turno, disciplina, ano, data: dataChamada, aula } = body;
    if (!serie || !turma || !turno || !disciplina || !ano || !dataChamada) {
      return NextResponse.json({ error: 'Parametros da chamada incompletos' }, { status: 400 });
    }

    const credentials = getCredentials(body);
    let presentIds: number[];

    if (body.presentStudentIds) {
      // Direct IDs provided
      presentIds = body.presentStudentIds;
    } else if (body.alunoMap && body.presencas) {
      // Map from Luminar IDs using the mapping
      presentIds = [];
      for (const [luminarId, isPresent] of Object.entries(body.presencas)) {
        if (isPresent && body.alunoMap[luminarId]) {
          presentIds.push(body.alunoMap[luminarId] as number);
        }
      }
    } else if (body.absentStudentIds) {
      // Fetch all students and subtract absent ones
      const allStudents = await chamadaClient.fetchStudents(credentials, { serie, turma, turno, ano });
      const absentSet = new Set<number>(body.absentStudentIds);
      presentIds = allStudents.filter(s => !absentSet.has(s.id)).map(s => s.id);
    } else {
      return NextResponse.json(
        { error: 'Forneca presentStudentIds, absentStudentIds, ou alunoMap + presencas' },
        { status: 400 }
      );
    }

    const result = await chamadaClient.submit(credentials, {
      presentStudentIds: presentIds,
      data: dataChamada,
      aula: aula || 1,
      serie,
      turma,
      turno,
      disciplina,
      ano,
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      presentCount: presentIds.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro SGE';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
