/**
 * API para download do template de importacao de horarios.
 */

import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { disciplinaService, turmaService } from '@/services/firestore';

// Horarios padrao
const MATUTINO_SLOTS = [
  { tempo: '1º', horario: '07:00 - 07:45' },
  { tempo: '2º', horario: '07:45 - 08:30' },
  { tempo: '3º', horario: '08:30 - 09:15' },
  { tempo: '4º', horario: '09:15 - 10:00' },
  { tempo: '5º', horario: '10:00 - 10:45' },
  { tempo: '6º', horario: '10:45 - 11:30' },
  { tempo: '7º', horario: '11:30 - 12:15' },
];

const VESPERTINO_SLOTS = [
  { tempo: '1º', horario: '13:00 - 13:45' },
  { tempo: '2º', horario: '13:45 - 14:30' },
  { tempo: '3º', horario: '14:30 - 15:15' },
  { tempo: '4º', horario: '15:15 - 16:00' },
  { tempo: '5º', horario: '16:00 - 16:45' },
  { tempo: '6º', horario: '16:45 - 17:30' },
  { tempo: '7º', horario: '17:30 - 18:15' },
];

const SEXTA_VESPERTINO_SLOTS = [
  { tempo: '1º', horario: '13:00 - 13:35' },
  { tempo: '2º', horario: '13:35 - 14:10' },
  { tempo: '3º', horario: '14:10 - 14:45' },
  { tempo: '4º', horario: '14:45 - 15:20' },
  { tempo: '5º', horario: '15:20 - 15:55' },
  { tempo: '6º', horario: '15:55 - 16:30' },
  { tempo: '7º', horario: '16:30 - 17:05' },
];

const DIAS = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

// Gera linhas de horario para um turno
function gerarLinhasTurno(
  turno: 'Matutino' | 'Vespertino',
  turmasNomes: string[]
): (string | number)[][] {
  const linhas: (string | number)[][] = [];
  const emptyCells = turmasNomes.map(() => '');

  for (const dia of DIAS) {
    const slots = turno === 'Vespertino' && dia === 'SEXTA'
      ? SEXTA_VESPERTINO_SLOTS
      : turno === 'Matutino' ? MATUTINO_SLOTS : VESPERTINO_SLOTS;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (i === 0) {
        linhas.push([dia, slot.tempo, slot.horario, ...emptyCells]);
      } else {
        linhas.push(['', slot.tempo, slot.horario, ...emptyCells]);
      }
    }
  }

  return linhas;
}

// Gera o template de horarios dinamicamente
export async function GET() {
  try {
    // Buscar turmas do sistema (ano atual)
    const anoAtual = new Date().getFullYear();
    const turmas = await turmaService.getByAno(anoAtual);

    // Filtrar turmas ativas e separar por turno
    const turmasAtivas = turmas.filter(t => t.ativo !== false);

    // Ordenar turmas: Fundamental primeiro, depois Médio, depois por série e turma
    const sortTurmas = (a: typeof turmas[0], b: typeof turmas[0]) => {
      const ensinoOrder: Record<string, number> = {
        'Ensino Fundamental II': 1,
        'Ensino Médio': 2,
      };
      const orderA = ensinoOrder[a.ensino || ''] || 99;
      const orderB = ensinoOrder[b.ensino || ''] || 99;
      if (orderA !== orderB) return orderA - orderB;

      const numA = parseInt((a.serie || '').match(/\d+/)?.[0] || '99');
      const numB = parseInt((b.serie || '').match(/\d+/)?.[0] || '99');
      if (numA !== numB) return numA - numB;

      return (a.turma || '').localeCompare(b.turma || '');
    };

    const turmasMatutino = turmasAtivas
      .filter(t => t.turno === 'Matutino')
      .sort(sortTurmas);

    const turmasVespertino = turmasAtivas
      .filter(t => t.turno === 'Vespertino')
      .sort(sortTurmas);

    // Nomes das turmas para os cabeçalhos
    const nomesMatutino = turmasMatutino.map(t => t.nome);
    const nomesVespertino = turmasVespertino.map(t => t.nome);

    // Criar workbook
    const workbook = XLSX.utils.book_new();

    // Gerar dados da planilha
    const sheetData: (string | number)[][] = [];

    // MATUTINO
    if (nomesMatutino.length > 0) {
      sheetData.push(['MATUTINO']);
      sheetData.push(['DIA', 'TEMPO', 'HORÁRIO', ...nomesMatutino]);
      sheetData.push(...gerarLinhasTurno('Matutino', nomesMatutino));
      sheetData.push([]); // Linha vazia
    }

    // VESPERTINO
    if (nomesVespertino.length > 0) {
      sheetData.push(['VESPERTINO']);
      sheetData.push(['DIA', 'TEMPO', 'HORÁRIO', ...nomesVespertino]);
      sheetData.push(...gerarLinhasTurno('Vespertino', nomesVespertino));
    }

    // Criar worksheet de horarios
    const wsHorarios = XLSX.utils.aoa_to_sheet(sheetData);

    // Ajustar largura das colunas
    const maxTurmas = Math.max(nomesMatutino.length, nomesVespertino.length);
    wsHorarios['!cols'] = [
      { wch: 12 }, // DIA
      { wch: 6 },  // TEMPO
      { wch: 15 }, // HORÁRIO
      ...Array(maxTurmas).fill({ wch: 30 }), // Turmas (largura maior para nome completo + ID)
    ];

    XLSX.utils.book_append_sheet(workbook, wsHorarios, 'HORARIOS');

    // Criar worksheet de instrucoes
    const instrucoes = [
      ['INSTRUÇÕES PARA PREENCHIMENTO'],
      [],
      ['1. ESTRUTURA:'],
      [`   - MATUTINO: ${nomesMatutino.join(', ') || 'Nenhuma turma'}`],
      [`   - VESPERTINO: ${nomesVespertino.join(', ') || 'Nenhuma turma'}`],
      [],
      ['2. COLUNAS:'],
      ['   - DIA: Dia da semana (SEGUNDA, TERÇA, QUARTA, QUINTA, SEXTA)'],
      ['   - TEMPO: Número do tempo (1º, 2º, 3º, etc.)'],
      ['   - HORÁRIO: Intervalo de tempo (ex: 07:00 - 07:45)'],
      ['   - Demais colunas: Turmas (nomes exatos do sistema)'],
      [],
      ['3. PREENCHIMENTO:'],
      ['   - Nas células de turma, coloque o ID da disciplina'],
      ['   - Copie o ID da aba DISCIPLINAS para evitar erros'],
      ['   - Deixe em branco os horários sem aula'],
      [],
      ['4. OBSERVAÇÕES:'],
      ['   - Os cabeçalhos das turmas são os nomes exatos do sistema'],
      ['   - Os horários da sexta-feira vespertino são reduzidos (35 min)'],
      ['   - Horários com conflito serão pulados na importação'],
      [],
      ['5. EXEMPLO:'],
      ['   Copie o ID da disciplina da aba DISCIPLINAS e cole na célula'],
    ];

    const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoes);
    wsInstrucoes['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, wsInstrucoes, 'INSTRUÇÕES');

    // Criar worksheet de turmas
    const turmasData = [
      ['TURMAS CADASTRADAS NO SISTEMA'],
      [],
      ['Os cabeçalhos da aba HORARIOS usam o NOME exato abaixo.'],
      ['Se precisar verificar, use esta lista como referência.'],
      [],
      ['ID', 'NOME', 'TURNO'],
      ...turmasMatutino.map(t => [t.id, t.nome, 'Matutino']),
      ...turmasVespertino.map(t => [t.id, t.nome, 'Vespertino']),
    ];

    const wsTurmas = XLSX.utils.aoa_to_sheet(turmasData);
    wsTurmas['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, wsTurmas, 'TURMAS');

    // Buscar disciplinas do sistema
    const disciplinas = await disciplinaService.getAll();
    const disciplinasAtivas = disciplinas
      .filter(d => d.ativo && !d.isGroup)
      .sort((a, b) => a.nome.localeCompare(b.nome));

    // Criar worksheet de disciplinas
    const disciplinasData = [
      ['DISCIPLINAS CADASTRADAS NO SISTEMA'],
      [],
      ['Use o ID ou o NOME na planilha de horários.'],
      ['Recomendado: use o ID para evitar erros de digitação.'],
      [],
      ['ID', 'NOME DA DISCIPLINA'],
      ...disciplinasAtivas.map(d => [d.id, d.nome.toUpperCase()]),
    ];

    const wsDisciplinas = XLSX.utils.aoa_to_sheet(disciplinasData);
    wsDisciplinas['!cols'] = [{ wch: 30 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(workbook, wsDisciplinas, 'DISCIPLINAS');

    // Gerar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Retornar como download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="MODELO_HORARIOS_IMPORTACAO.xlsx"',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar template:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar template' },
      { status: 500 }
    );
  }
}
