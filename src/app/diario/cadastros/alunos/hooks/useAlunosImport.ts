/**
 * Hook para importação e exclusão em massa de alunos.
 * Executa client-side usando o Firebase SDK autenticado do browser.
 */

import { useState, useCallback } from 'react';
import { collection, addDoc, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUIStore } from '@/store/uiStore';

interface ImportResult {
  success: boolean;
  message?: string;
  imported?: number;
  skipped?: number;
  errors?: string[];
  totalErrors?: number;
  error?: string;
}

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

const SPECIAL_COLUMNS: Record<number, string> = {
  14: 'responsavelTelefone',
  15: 'responsavelCpf',
  16: 'responsavelEmail',
  18: 'paiTelefone',
  19: 'paiEmail',
  21: 'maeTelefone',
  22: 'maeEmail',
};

function cleanString(value: any): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  return String(value).trim();
}

function cleanPhone(value: any): string | undefined {
  if (!value) return undefined;
  const cleaned = String(value).replace(/\D/g, '');
  if (cleaned.length < 8) return undefined;
  return cleaned;
}

function parseSexo(value: any): 'M' | 'F' | undefined {
  if (!value) return undefined;
  const str = String(value).toUpperCase().trim();
  if (str === 'M' || str === 'MASCULINO') return 'M';
  if (str === 'F' || str === 'FEMININO') return 'F';
  return undefined;
}

export function useAlunosImport(onSuccess?: () => void) {
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { addToast } = useUIStore();

  const importFromFile = useCallback(async (file: File) => {
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      addToast('Arquivo inválido. Envie um arquivo Excel (.xlsx ou .xls)', 'error');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const XLSX = await import('xlsx');

      // Ler arquivo
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

      if (rawData.length < 2) {
        setImportResult({ success: false, error: 'Planilha vazia ou sem dados' });
        return;
      }

      const headers = rawData[0] as string[];
      const dataRows = rawData.slice(1);

      // Buscar turmas para mapear nome -> id
      const turmasSnapshot = await getDocs(collection(db, 'turmas'));
      const turmasMap = new Map<string, { id: string; serie: string; ensino: string; turma: string; turno: string }>();
      turmasSnapshot.docs.forEach(d => {
        const data = d.data();
        turmasMap.set(data.nome, {
          id: d.id,
          serie: data.serie,
          ensino: data.ensino,
          turma: data.turma,
          turno: data.turno,
        });
      });

      const alunosRef = collection(db, 'alunos');
      const now = Timestamp.now();
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
        const row = dataRows[rowIndex] as any[];
        if (!row || row.length === 0) continue;

        const alunoData: Partial<AlunoImport> = {};

        headers.forEach((header, colIndex) => {
          const value = row[colIndex];
          if (value === null || value === undefined || value === '') return;

          const specialField = SPECIAL_COLUMNS[colIndex];
          if (specialField) {
            if (specialField.includes('Telefone')) {
              (alunoData as any)[specialField] = cleanPhone(value);
            } else {
              (alunoData as any)[specialField] = cleanString(value);
            }
            return;
          }

          const field = COLUMN_MAP[header];
          if (field) {
            (alunoData as any)[field] = cleanString(value);
          }
        });

        if (!alunoData.nome) { skipped++; continue; }

        // Resolver turma
        const turmaLetra = alunoData.turma;
        const serie = alunoData.serie;
        const turno = alunoData.turno;
        const ensino = alunoData.ensino;

        if (!serie || !turmaLetra || !turno) {
          errors.push(`Linha ${rowIndex + 2}: Dados de turma incompletos`);
          skipped++;
          continue;
        }

        const turmaNome = `${serie} ${turmaLetra} - ${turno}`;
        if (!turmasMap.has(turmaNome)) {
          errors.push(`Linha ${rowIndex + 2}: Turma "${turmaNome}" nao encontrada`);
          skipped++;
          continue;
        }

        const turmaInfo = turmasMap.get(turmaNome)!;

        // Parsear data de nascimento
        let dataNascimento: Date | undefined;
        if (alunoData.dataNascimento) {
          const raw = (row as any[])[headers.indexOf('Data de Nascimento')];
          if (raw instanceof Date) {
            dataNascimento = raw;
          } else if (typeof raw === 'number') {
            const d = XLSX.SSF.parse_date_code(raw);
            dataNascimento = new Date(d.y, d.m - 1, d.d);
          } else if (typeof raw === 'string') {
            const match = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (match) dataNascimento = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
          }
        }

        const alunoDoc: Record<string, any> = {
          nome: alunoData.nome,
          turmaId: turmaInfo.id,
          turma: turmaNome,
          serie,
          ensino: ensino || undefined,
          turno,
          ativo: true,
          createdAt: now,
          updatedAt: now,
        };

        // Campos opcionais
        if (alunoData.matricula) alunoDoc.matricula = alunoData.matricula;
        if (alunoData.inep) alunoDoc.inep = alunoData.inep;
        if (alunoData.cpf) alunoDoc.cpf = alunoData.cpf;
        if (alunoData.rg) alunoDoc.rg = alunoData.rg;
        if (alunoData.sexo) alunoDoc.sexo = parseSexo(alunoData.sexo);
        if (dataNascimento) alunoDoc.dataNascimento = dataNascimento;
        if (alunoData.naturalidade) alunoDoc.naturalidade = alunoData.naturalidade;
        if (alunoData.uf) alunoDoc.uf = alunoData.uf;
        if (alunoData.responsavelNome) alunoDoc.responsavelNome = alunoData.responsavelNome;
        if (alunoData.responsavelTelefone) alunoDoc.responsavelTelefone = alunoData.responsavelTelefone;
        if (alunoData.responsavelCpf) alunoDoc.responsavelCpf = alunoData.responsavelCpf;
        if (alunoData.responsavelEmail) alunoDoc.responsavelEmail = alunoData.responsavelEmail;
        if (alunoData.paiNome) alunoDoc.paiNome = alunoData.paiNome;
        if (alunoData.paiTelefone) alunoDoc.paiTelefone = alunoData.paiTelefone;
        if (alunoData.paiEmail) alunoDoc.paiEmail = alunoData.paiEmail;
        if (alunoData.maeNome) alunoDoc.maeNome = alunoData.maeNome;
        if (alunoData.maeTelefone) alunoDoc.maeTelefone = alunoData.maeTelefone;
        if (alunoData.maeEmail) alunoDoc.maeEmail = alunoData.maeEmail;
        if (alunoData.logradouro) alunoDoc.logradouro = alunoData.logradouro;
        if (alunoData.cep) alunoDoc.cep = alunoData.cep;
        if (alunoData.bairro) alunoDoc.bairro = alunoData.bairro;
        if (alunoData.indicador) alunoDoc.indicador = alunoData.indicador;

        try {
          await addDoc(alunosRef, alunoDoc);
          imported++;
        } catch (err: any) {
          errors.push(`Linha ${rowIndex + 2}: ${err.message}`);
          skipped++;
        }
      }

      const result: ImportResult = {
        success: true,
        message: `Importacao concluida: ${imported} alunos importados, ${skipped} ignorados`,
        imported,
        skipped,
        errors: errors.slice(0, 10),
        totalErrors: errors.length,
      };

      setImportResult(result);
      if (imported > 0) {
        addToast(result.message!, 'success');
        onSuccess?.();
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao importar alunos';
      addToast(errorMsg, 'error');
      setImportResult({ success: false, error: errorMsg });
    } finally {
      setImporting(false);
    }
  }, [addToast, onSuccess]);

  const deleteAll = useCallback(async () => {
    setDeleting(true);

    try {
      const snapshot = await getDocs(collection(db, 'alunos'));

      if (snapshot.empty) {
        addToast('Nenhum aluno encontrado para deletar', 'info');
        setDeleting(false);
        return;
      }

      // Deletar em batches de 500
      let deleted = 0;
      let batch = writeBatch(db);
      let batchCount = 0;

      for (const docSnap of snapshot.docs) {
        batch.delete(doc(db, 'alunos', docSnap.id));
        batchCount++;
        deleted++;

        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      addToast(`${deleted} alunos deletados com sucesso`, 'success');
      onSuccess?.();
    } catch (error: any) {
      addToast(error.message || 'Erro ao deletar alunos', 'error');
    } finally {
      setDeleting(false);
    }
  }, [addToast, onSuccess]);

  return {
    importing,
    deleting,
    importResult,
    importFromFile,
    deleteAll,
    clearResult: () => setImportResult(null),
  };
}
