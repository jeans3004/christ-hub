/**
 * API Route para deletar todos os alunos do sistema.
 * DELETE /api/alunos/delete-all
 */

import { NextResponse } from 'next/server';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function DELETE() {
  try {
    const alunosRef = collection(db, 'alunos');
    const snapshot = await getDocs(alunosRef);

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum aluno encontrado para deletar',
        deleted: 0,
      });
    }

    // Deletar em batches de 500 (limite do Firestore)
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

    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `${deleted} alunos deletados com sucesso`,
      deleted,
    });
  } catch (error: any) {
    console.error('Error deleting all students:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao deletar alunos' },
      { status: 500 }
    );
  }
}
