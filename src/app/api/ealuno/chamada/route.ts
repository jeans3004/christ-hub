/**
 * API Route: Registrar chamada no e-aluno.
 * POST /api/ealuno/chamada
 *
 * Recebe os dados da chamada do Luminar e registra no e-aluno.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  eAlunoLogin,
  eAlunoFetchStudents,
  eAlunoSubmitChamada,
  decryptPassword,
} from '@/lib/eAlunoProxy';

interface ChamadaRequest {
  // Credentials
  user: string;
  password: string;
  encrypted?: boolean;
  // E-aluno IDs (already mapped)
  serie: number;
  turma: number;
  turno: string;
  disciplina: number;
  ano: number;
  // Chamada data
  data: string;        // YYYY-MM-DD
  aula: number;        // Period number
  // Students - either mapped IDs or names to auto-match
  presentStudentIds?: number[];
  absentStudentIds?: number[];
  // Alternative: send Luminar data for auto-matching
  alunoMap?: Record<string, number>;  // luminarAlunoId -> eAlunoId
  presencas?: Record<string, boolean>; // luminarAlunoId -> isPresent
}

export async function POST(request: NextRequest) {
  try {
    const body: ChamadaRequest = await request.json();
    const { user, serie, turma, turno, disciplina, ano, data: dataChamada, aula } = body;

    if (!user || !body.password) {
      return NextResponse.json({ error: 'Credenciais obrigatorias' }, { status: 400 });
    }
    if (!serie || !turma || !turno || !disciplina || !ano || !dataChamada) {
      return NextResponse.json({ error: 'Parametros da chamada incompletos' }, { status: 400 });
    }

    const password = body.encrypted ? decryptPassword(body.password) : body.password;
    const session = await eAlunoLogin(user, password);

    let presentIds: number[];

    if (body.presentStudentIds) {
      // Direct IDs provided
      presentIds = body.presentStudentIds;
    } else if (body.alunoMap && body.presencas) {
      // Map from Luminar IDs using the mapping
      presentIds = [];
      for (const [luminarId, isPresent] of Object.entries(body.presencas)) {
        if (isPresent && body.alunoMap[luminarId]) {
          presentIds.push(body.alunoMap[luminarId]);
        }
      }
    } else if (body.absentStudentIds) {
      // We have absent IDs - need to get full list and subtract
      const allStudents = await eAlunoFetchStudents(session, serie, turma, turno, ano);
      const absentSet = new Set(body.absentStudentIds);
      presentIds = allStudents.filter(s => !absentSet.has(s.id)).map(s => s.id);
    } else {
      return NextResponse.json(
        { error: 'Forneça presentStudentIds, absentStudentIds, ou alunoMap + presencas' },
        { status: 400 }
      );
    }

    const result = await eAlunoSubmitChamada(session, {
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
      responseBody: result.responseBody,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar chamada no e-aluno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
