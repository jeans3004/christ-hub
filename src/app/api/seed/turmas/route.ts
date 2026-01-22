/**
 * API Route para configurar turmas do sistema.
 * DELETE: Remove todas as turmas
 * POST: Cria turmas com a estrutura padrão
 *
 * Estrutura:
 * - Serie: 6º Ano, 7º Ano, 8º Ano, 9º Ano (Fund. II), 1ª Série, 2ª Série, 3ª Série (Médio)
 * - Ensino: Ensino Fundamental II, Ensino Médio
 * - Turma: A, B, C
 * - Turno: Matutino, Vespertino
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, deleteDoc, doc, addDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TipoEnsino, Turno } from '@/types';

// Configuração das séries
const SERIES_CONFIG: { serie: string; ensino: TipoEnsino }[] = [
  // Ensino Fundamental II
  { serie: '6º Ano', ensino: 'Ensino Fundamental II' },
  { serie: '7º Ano', ensino: 'Ensino Fundamental II' },
  { serie: '8º Ano', ensino: 'Ensino Fundamental II' },
  { serie: '9º Ano', ensino: 'Ensino Fundamental II' },
  // Ensino Médio
  { serie: '1ª Série', ensino: 'Ensino Médio' },
  { serie: '2ª Série', ensino: 'Ensino Médio' },
  { serie: '3ª Série', ensino: 'Ensino Médio' },
];

// Turmas disponíveis
const TURMAS = ['A', 'B', 'C'];

// Turnos disponíveis
const TURNOS: Turno[] = ['Matutino', 'Vespertino'];

// Gera nome da turma: "6º Ano A - Matutino"
function gerarNomeTurma(serie: string, turma: string, turno: string): string {
  return `${serie} ${turma} - ${turno}`;
}

// DELETE - Remove todas as turmas
export async function DELETE() {
  try {
    const turmasRef = collection(db, 'turmas');
    const snapshot = await getDocs(turmasRef);

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma turma encontrada para deletar',
        deleted: 0,
      });
    }

    // Deletar em batches
    const batchSize = 500;
    let deleted = 0;
    let batch = writeBatch(db);
    let batchCount = 0;

    for (const docSnap of snapshot.docs) {
      batch.delete(doc(db, 'turmas', docSnap.id));
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
      message: `${deleted} turmas deletadas com sucesso`,
      deleted,
    });
  } catch (error: any) {
    console.error('Error deleting turmas:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao deletar turmas' },
      { status: 500 }
    );
  }
}

// POST - Cria todas as turmas
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const anoLetivo = parseInt(searchParams.get('ano') || String(new Date().getFullYear()), 10);
    const deleteFirst = searchParams.get('clean') === 'true';

    // Se clean=true, deletar todas primeiro
    if (deleteFirst) {
      const turmasRef = collection(db, 'turmas');
      const snapshot = await getDocs(turmasRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach(docSnap => batch.delete(doc(db, 'turmas', docSnap.id)));
      if (!snapshot.empty) {
        await batch.commit();
      }
    }

    const turmasRef = collection(db, 'turmas');
    const now = Timestamp.now();
    const turmasCriadas: string[] = [];

    // Criar todas as combinações
    for (const { serie, ensino } of SERIES_CONFIG) {
      for (const turma of TURMAS) {
        for (const turno of TURNOS) {
          const nome = gerarNomeTurma(serie, turma, turno);

          await addDoc(turmasRef, {
            nome,
            serie,
            ensino,
            turma,
            turno,
            ano: anoLetivo,
            ativo: true,
            createdAt: now,
            updatedAt: now,
          });

          turmasCriadas.push(nome);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${turmasCriadas.length} turmas criadas para o ano ${anoLetivo}`,
      anoLetivo,
      total: turmasCriadas.length,
      turmas: turmasCriadas,
      estrutura: {
        series: SERIES_CONFIG.map(s => s.serie),
        turmas: TURMAS,
        turnos: TURNOS,
      },
    });
  } catch (error: any) {
    console.error('Error creating turmas:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar turmas' },
      { status: 500 }
    );
  }
}

// GET - Lista turmas existentes
export async function GET() {
  try {
    const turmasRef = collection(db, 'turmas');
    const snapshot = await getDocs(turmasRef);

    const turmas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Agrupar por série
    const porSerie: Record<string, any[]> = {};
    turmas.forEach((t: any) => {
      if (!porSerie[t.serie]) {
        porSerie[t.serie] = [];
      }
      porSerie[t.serie].push({
        id: t.id,
        nome: t.nome,
        turma: t.turma,
        turno: t.turno,
        ensino: t.ensino,
      });
    });

    return NextResponse.json({
      success: true,
      total: turmas.length,
      turmasPorSerie: porSerie,
      endpoints: {
        POST: '/api/seed/turmas?ano=2026&clean=true - Cria turmas (clean=true deleta existentes)',
        DELETE: '/api/seed/turmas - Deleta todas as turmas',
      },
    });
  } catch (error: any) {
    console.error('Error listing turmas:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao listar turmas' },
      { status: 500 }
    );
  }
}
