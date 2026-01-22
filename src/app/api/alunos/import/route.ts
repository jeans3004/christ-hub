/**
 * API Route para importar alunos de planilha Excel.
 * POST /api/alunos/import
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as XLSX from 'xlsx';

interface AlunoImport {
  matricula?: string;
  inep?: string;
  nome: string;
  cpf?: string;
  rg?: string;
  sexo?: string;
  dataNascimento?: string;
  naturalidade?: string;
  uf?: string;
  serie?: string;
  ensino?: string;
  turma?: string;
  turno?: string;
  responsavelNome?: string;
  responsavelTelefone?: string;
  responsavelCpf?: string;
  responsavelEmail?: string;
  paiNome?: string;
  paiTelefone?: string;
  paiEmail?: string;
  maeNome?: string;
  maeTelefone?: string;
  maeEmail?: string;
  logradouro?: string;
  cep?: string;
  bairro?: string;
  indicador?: string;
}

// Mapeamento de colunas da planilha para campos do sistema
const COLUMN_MAP: Record<string, keyof AlunoImport> = {
  'Matricula': 'matricula',
  'INEP': 'inep',
  'Nome': 'nome',
  'CPF': 'cpf',
  'RG': 'rg',
  'Sexo': 'sexo',
  'Data de Nascimento': 'dataNascimento',
  'Naturalidade': 'naturalidade',
  'UF': 'uf',
  'Serie': 'serie',
  'Ensino': 'ensino',
  'Turma': 'turma',
  'Turno': 'turno',
  'Responsavel': 'responsavelNome',
  'Pai': 'paiNome',
  'Mae': 'maeNome',
  'Logradouro': 'logradouro',
  'CEP': 'cep',
  'Bairro': 'bairro',
  'Indicador': 'indicador',
};

// Índices de colunas com nomes repetidos (Telefone, CPF, Email aparecem várias vezes)
const SPECIAL_COLUMNS = {
  14: 'responsavelTelefone',  // Telefone do Responsável
  15: 'responsavelCpf',       // CPF do Responsável
  16: 'responsavelEmail',     // Email do Responsável
  18: 'paiTelefone',          // Telefone do Pai
  19: 'paiEmail',             // Email do Pai
  21: 'maeTelefone',          // Telefone da Mãe
  22: 'maeEmail',             // Email da Mãe
};

function parseDate(value: any): Date | undefined {
  if (!value) return undefined;

  // Se for número (Excel serial date)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    return new Date(date.y, date.m - 1, date.d);
  }

  // Se for string, tentar parsear
  if (typeof value === 'string') {
    // Formato DD/MM/YYYY
    const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
    }
    // Tentar parse direto
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return undefined;
}

function parseSexo(value: any): 'M' | 'F' | undefined {
  if (!value) return undefined;
  const str = String(value).toUpperCase().trim();
  if (str === 'M' || str === 'MASCULINO') return 'M';
  if (str === 'F' || str === 'FEMININO') return 'F';
  return undefined;
}

function cleanString(value: any): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  return String(value).trim();
}

function cleanPhone(value: any): string | undefined {
  if (!value) return undefined;
  // Remove tudo exceto números
  const cleaned = String(value).replace(/\D/g, '');
  if (cleaned.length < 8) return undefined;
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Ler arquivo Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    if (rawData.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Planilha vazia ou sem dados' },
        { status: 400 }
      );
    }

    // Primeira linha é o cabeçalho
    const headers = rawData[0] as string[];
    const dataRows = rawData.slice(1);

    // Buscar turmas existentes para mapear nome -> id
    const turmasRef = collection(db, 'turmas');
    const turmasSnapshot = await getDocs(turmasRef);
    const turmasMap = new Map<string, { id: string; serie: string; ensino: string; turma: string; turno: string }>();
    turmasSnapshot.docs.forEach(doc => {
      const data = doc.data();
      turmasMap.set(data.nome, {
        id: doc.id,
        serie: data.serie,
        ensino: data.ensino,
        turma: data.turma,
        turno: data.turno,
      });
    });

    // Função para gerar nome da turma no formato esperado
    function generateTurmaNome(serie: string, turmaLetra: string, turno: string): string {
      return `${serie} ${turmaLetra} - ${turno}`;
    }

    const alunosRef = collection(db, 'alunos');
    const now = Timestamp.now();
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex] as any[];
      if (!row || row.length === 0) continue;

      // Mapear dados da linha
      const alunoData: Partial<AlunoImport> = {};

      headers.forEach((header, colIndex) => {
        const value = row[colIndex];
        if (value === null || value === undefined || value === '') return;

        // Verificar colunas especiais (repetidas)
        const specialField = SPECIAL_COLUMNS[colIndex as keyof typeof SPECIAL_COLUMNS];
        if (specialField) {
          if (specialField.includes('Telefone')) {
            (alunoData as any)[specialField] = cleanPhone(value);
          } else {
            (alunoData as any)[specialField] = cleanString(value);
          }
          return;
        }

        // Mapear pelo nome da coluna
        const field = COLUMN_MAP[header];
        if (field) {
          (alunoData as any)[field] = cleanString(value);
        }
      });

      // Validar nome obrigatório
      if (!alunoData.nome) {
        skipped++;
        continue;
      }

      // Buscar turma - construir nome completo a partir de Serie + Turma + Turno
      const turmaLetra = alunoData.turma;  // "A", "B", "C"
      const serie = alunoData.serie;       // "6º Ano", "1ª Série", etc.
      const turno = alunoData.turno;       // "Matutino", "Vespertino"
      const ensino = alunoData.ensino;     // "Ensino Fundamental II", "Ensino Médio"
      let turmaId = '';
      let turmaNome = '';

      if (serie && turmaLetra && turno) {
        // Gerar nome da turma no formato: "6º Ano A - Matutino"
        turmaNome = generateTurmaNome(serie, turmaLetra, turno);

        if (turmasMap.has(turmaNome)) {
          const turmaInfo = turmasMap.get(turmaNome)!;
          turmaId = turmaInfo.id;
        } else {
          // Turma não encontrada
          errors.push(`Linha ${rowIndex + 2}: Turma "${turmaNome}" não encontrada`);
          skipped++;
          continue;
        }
      } else {
        // Dados insuficientes para determinar a turma
        errors.push(`Linha ${rowIndex + 2}: Dados de turma incompletos (Serie: ${serie}, Turma: ${turmaLetra}, Turno: ${turno})`);
        skipped++;
        continue;
      }

      // Criar documento do aluno
      const alunoDoc = {
        nome: alunoData.nome,
        matricula: alunoData.matricula || undefined,
        inep: alunoData.inep || undefined,
        cpf: alunoData.cpf || undefined,
        rg: alunoData.rg || undefined,
        sexo: parseSexo(alunoData.sexo),
        dataNascimento: parseDate(alunoData.dataNascimento) || undefined,
        naturalidade: alunoData.naturalidade || undefined,
        uf: alunoData.uf || undefined,
        turmaId,
        turma: turmaNome,
        serie: serie,
        ensino: ensino || undefined,
        turno: turno as any,
        responsavelNome: alunoData.responsavelNome || undefined,
        responsavelTelefone: alunoData.responsavelTelefone || undefined,
        responsavelCpf: alunoData.responsavelCpf || undefined,
        responsavelEmail: alunoData.responsavelEmail || undefined,
        paiNome: alunoData.paiNome || undefined,
        paiTelefone: alunoData.paiTelefone || undefined,
        paiEmail: alunoData.paiEmail || undefined,
        maeNome: alunoData.maeNome || undefined,
        maeTelefone: alunoData.maeTelefone || undefined,
        maeEmail: alunoData.maeEmail || undefined,
        logradouro: alunoData.logradouro || undefined,
        cep: alunoData.cep || undefined,
        bairro: alunoData.bairro || undefined,
        indicador: alunoData.indicador || undefined,
        ativo: true,
        createdAt: now,
        updatedAt: now,
      };

      // Remover campos undefined
      Object.keys(alunoDoc).forEach(key => {
        if ((alunoDoc as any)[key] === undefined) {
          delete (alunoDoc as any)[key];
        }
      });

      try {
        await addDoc(alunosRef, alunoDoc);
        imported++;
      } catch (err: any) {
        errors.push(`Linha ${rowIndex + 2}: ${err.message}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Importação concluída: ${imported} alunos importados, ${skipped} ignorados`,
      imported,
      skipped,
      errors: errors.slice(0, 10), // Limitar a 10 erros
      totalErrors: errors.length,
    });
  } catch (error: any) {
    console.error('Error importing students:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao importar alunos' },
      { status: 500 }
    );
  }
}
