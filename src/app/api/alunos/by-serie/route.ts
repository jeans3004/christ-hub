/**
 * API Route para gerenciar alunos por série.
 * GET /api/alunos/by-serie?serie=3ª Série - Lista alunos da série
 * DELETE /api/alunos/by-serie?serie=3ª Série - Deleta alunos da série
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serie = searchParams.get('serie');

    if (!serie) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro "serie" é obrigatório' },
        { status: 400 }
      );
    }

    const alunosRef = collection(db, 'alunos');
    const q = query(alunosRef, where('serie', '==', serie));
    const snapshot = await getDocs(q);

    const alunos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Analisar duplicados por nome
    const nomeCount: Record<string, { count: number; ids: string[]; turmas: string[] }> = {};
    alunos.forEach((aluno: any) => {
      const nome = aluno.nome?.trim().toLowerCase();
      if (!nomeCount[nome]) {
        nomeCount[nome] = { count: 0, ids: [], turmas: [] };
      }
      nomeCount[nome].count++;
      nomeCount[nome].ids.push(aluno.id);
      nomeCount[nome].turmas.push(aluno.turma || 'N/A');
    });

    const duplicados = Object.entries(nomeCount)
      .filter(([_, data]) => data.count > 1)
      .map(([nome, data]) => ({
        nome,
        quantidade: data.count,
        ids: data.ids,
        turmas: data.turmas,
      }));

    return NextResponse.json({
      success: true,
      serie,
      total: alunos.length,
      duplicados: {
        quantidade: duplicados.length,
        lista: duplicados,
      },
      alunos: alunos.map((a: any) => ({
        id: a.id,
        nome: a.nome,
        matricula: a.matricula,
        turma: a.turma,
        turno: a.turno,
      })),
    });
  } catch (error: any) {
    console.error('Error listing students by serie:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao listar alunos' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serie = searchParams.get('serie');

    if (!serie) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro "serie" é obrigatório' },
        { status: 400 }
      );
    }

    const alunosRef = collection(db, 'alunos');
    const q = query(alunosRef, where('serie', '==', serie));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: `Nenhum aluno encontrado na série "${serie}"`,
        deleted: 0,
      });
    }

    // Deletar em batches
    const batchSize = 500;
    let deleted = 0;
    let batch = writeBatch(db);
    let batchCount = 0;

    for (const docSnap of snapshot.docs) {
      batch.delete(doc(db, 'alunos', docSnap.id));
      batchCount++;
      deleted++;

      if (batchCount >= batchSize) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `${deleted} alunos da série "${serie}" deletados com sucesso`,
      serie,
      deleted,
    });
  } catch (error: any) {
    console.error('Error deleting students by serie:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao deletar alunos' },
      { status: 500 }
    );
  }
}
