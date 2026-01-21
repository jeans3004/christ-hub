/**
 * API Route para popular turmas do sistema.
 * Cria turmas para todas as séries e turnos disponíveis.
 *
 * ATENÇÃO: Esta rota deve ser removida ou protegida em produção.
 */

import { NextResponse } from 'next/server';
import { turmaService } from '@/services/firestore';
import { Series, Turnos, Turma } from '@/types';

// Configuração de turmas por série
// Formato: { série: { quantidadeTurmasPorTurno, turnosAtivos } }
const configTurmas: Record<string, { qtdPorTurno: number; turnos: string[] }> = {
  '6o Ano - Ensino Fundamental II': { qtdPorTurno: 2, turnos: ['Matutino', 'Vespertino'] },
  '7o Ano - Ensino Fundamental II': { qtdPorTurno: 2, turnos: ['Matutino', 'Vespertino'] },
  '8o Ano - Ensino Fundamental II': { qtdPorTurno: 2, turnos: ['Matutino', 'Vespertino'] },
  '9o Ano - Ensino Fundamental II': { qtdPorTurno: 2, turnos: ['Matutino', 'Vespertino'] },
  '1a Série - Ensino Médio': { qtdPorTurno: 2, turnos: ['Matutino', 'Vespertino'] },
  '2a Série - Ensino Médio': { qtdPorTurno: 2, turnos: ['Matutino', 'Vespertino'] },
  '3a Série - Ensino Médio': { qtdPorTurno: 2, turnos: ['Matutino', 'Vespertino'] },
};

// Letras para identificar turmas (A, B, C, ...)
const letras = 'ABCDEFGHIJ'.split('');

// Abreviação dos turnos
const turnoAbrev: Record<string, string> = {
  Matutino: 'M',
  Vespertino: 'V',
  Noturno: 'N',
};

// Gera nome da turma: "6A-M" (6º ano, turma A, Matutino)
function gerarNomeTurma(serie: string, letra: string, turno: string): string {
  // Extrai o número/série (6o, 7o, 8o, 9o, 1a, 2a, 3a)
  const match = serie.match(/^(\d)[oa]/);
  if (!match) return `${letra}-${turnoAbrev[turno]}`;

  const numero = match[1];
  return `${numero}${letra}-${turnoAbrev[turno]}`;
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRecreate = searchParams.get('force') === 'true';
    const anoLetivo = parseInt(searchParams.get('ano') || String(new Date().getFullYear()), 10);

    // Buscar turmas existentes
    const turmasExistentes = await turmaService.getAll();
    const turmasExistentesMap = new Map<string, Turma>();

    turmasExistentes.forEach(t => {
      const key = `${t.nome}_${t.serie}_${t.turno}_${t.ano}`;
      turmasExistentesMap.set(key, t);
    });

    const turmasCriadas: string[] = [];
    const turmasIgnoradas: string[] = [];

    // Para cada série configurada
    for (const serie of Series) {
      const config = configTurmas[serie];
      if (!config) continue;

      // Para cada turno ativo nessa série
      for (const turno of config.turnos) {
        // Para cada turma nesse turno (A, B, C...)
        for (let i = 0; i < config.qtdPorTurno; i++) {
          const letra = letras[i];
          const nomeTurma = gerarNomeTurma(serie, letra, turno);

          const key = `${nomeTurma}_${serie}_${turno}_${anoLetivo}`;
          const turmaExistente = turmasExistentesMap.get(key);

          if (turmaExistente && !forceRecreate) {
            turmasIgnoradas.push(`${nomeTurma} (${serie}) - já existe`);
            continue;
          }

          // Se force=true e existe, deletar primeiro
          if (turmaExistente && forceRecreate) {
            await turmaService.delete(turmaExistente.id);
          }

          // Criar turma
          await turmaService.create({
            nome: nomeTurma,
            serie,
            turno: turno as typeof Turnos[number],
            ano: anoLetivo,
            ativo: true,
          });

          turmasCriadas.push(`${nomeTurma} (${serie} - ${turno})`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      anoLetivo,
      message: `${turmasCriadas.length} turmas criadas, ${turmasIgnoradas.length} ignoradas`,
      turmasCriadas,
      turmasIgnoradas: turmasIgnoradas.length > 0 ? turmasIgnoradas : undefined,
    });

  } catch (error) {
    console.error('Erro ao popular turmas:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const turmasExistentes = await turmaService.getAll();

    // Agrupar por série
    const porSerie: Record<string, { nome: string; turno: string; ativo: boolean }[]> = {};

    for (const turma of turmasExistentes) {
      if (!porSerie[turma.serie]) {
        porSerie[turma.serie] = [];
      }
      porSerie[turma.serie].push({
        nome: turma.nome,
        turno: turma.turno,
        ativo: turma.ativo,
      });
    }

    // Identificar séries sem turmas
    const seriesSemTurmas = Series.filter(s => !porSerie[s] || porSerie[s].length === 0);

    return NextResponse.json({
      message: 'Use POST para criar turmas. GET mostra turmas existentes.',
      totalTurmas: turmasExistentes.length,
      seriesSemTurmas,
      turmasPorSerie: porSerie,
      config: {
        series: Series,
        turnos: Turnos,
        parametros: '?force=true para recriar turmas existentes, ?ano=2025 para especificar ano',
      },
    });

  } catch (error) {
    console.error('Erro ao listar turmas:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
