/**
 * API Route para exportar alunos para planilha Excel.
 * GET /api/alunos/export
 * GET /api/alunos/export?turmaId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import * as XLSX from 'xlsx';

const HEADERS = [
  'Matricula',
  'INEP',
  'Nome',
  'CPF',
  'RG',
  'Sexo',
  'Data de Nascimento',
  'Naturalidade',
  'UF',
  'Serie',
  'Ensino',
  'Turma',
  'Turno',
  'Responsavel',
  'Telefone',
  'CPF',
  'Email',
  'Pai',
  'Telefone',
  'Email',
  'Mae',
  'Telefone',
  'Email',
  'Logradouro',
  'CEP',
  'Bairro',
  'Indicador',
];

function formatDate(value: any): string {
  if (!value) return '';
  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (value?.toDate && typeof value.toDate === 'function') {
    // Firestore Timestamp
    date = value.toDate();
  } else if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) date = parsed;
  }

  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const turmaIdFilter = searchParams.get('turmaId') || '';

    const db = getAdminDb();

    // Buscar turmas para mapear turmaId -> letra da turma
    const turmasSnapshot = await db.collection('turmas').get();
    const turmasMap = new Map<string, { turma: string; serie: string; ensino: string; turno: string }>();
    turmasSnapshot.docs.forEach(doc => {
      const data = doc.data();
      turmasMap.set(doc.id, {
        turma: data.turma || '',
        serie: data.serie || '',
        ensino: data.ensino || '',
        turno: data.turno || '',
      });
    });

    // Buscar alunos (com filtro opcional)
    let alunosQuery: FirebaseFirestore.Query = db.collection('alunos');
    if (turmaIdFilter) {
      alunosQuery = alunosQuery.where('turmaId', '==', turmaIdFilter);
    }

    const alunosSnapshot = await alunosQuery.get();

    // Montar linhas da planilha
    const rows: any[][] = [HEADERS];

    alunosSnapshot.docs.forEach(doc => {
      const a = doc.data();
      const turmaInfo = turmasMap.get(a.turmaId);

      rows.push([
        a.matricula || '',
        a.inep || '',
        a.nome || '',
        a.cpf || '',
        a.rg || '',
        a.sexo || '',
        formatDate(a.dataNascimento),
        a.naturalidade || '',
        a.uf || '',
        a.serie || turmaInfo?.serie || '',
        a.ensino || turmaInfo?.ensino || '',
        turmaInfo?.turma || '',
        a.turno || turmaInfo?.turno || '',
        a.responsavelNome || '',
        a.responsavelTelefone || '',
        a.responsavelCpf || '',
        a.responsavelEmail || '',
        a.paiNome || '',
        a.paiTelefone || '',
        a.paiEmail || '',
        a.maeNome || '',
        a.maeTelefone || '',
        a.maeEmail || '',
        a.logradouro || '',
        a.cep || '',
        a.bairro || '',
        a.indicador || '',
      ]);
    });

    // Gerar workbook Excel
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alunos');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="alunos.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Error exporting students:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao exportar alunos' },
      { status: 500 }
    );
  }
}
