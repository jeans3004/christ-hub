/**
 * API Route para popular turmas com alunos fictícios.
 * Nomes de jogadores lendários do futebol brasileiro (1970-2000).
 *
 * ATENÇÃO: Esta rota deve ser removida ou protegida em produção.
 */

import { NextResponse } from 'next/server';
import { turmaService, alunoService } from '@/services/firestore';

// Jogadores lendários do futebol brasileiro (1970-2000)
const jogadoresLendarios = [
  // Era 1970 - Tri Mundial
  'Edson Arantes do Nascimento', // Pelé
  'Jair Ventura Filho', // Jairzinho
  'Eduardo Gonçalves de Andrade', // Tostão
  'Gérson de Oliveira Nunes',
  'Roberto Rivelino',
  'Carlos Alberto Torres',
  'Clodoaldo Tavares',
  'Félix Miéli Venerando',
  'Brito de Oliveira',
  'Wilson da Silva Piazza',

  // Era 1982 - Geração de Ouro
  'Arthur Antunes Coimbra', // Zico
  'Sócrates Brasileiro Sampaio',
  'Paulo Roberto Falcão',
  'Leovegildo Lins da Gama Júnior',
  'Toninho Cerezo',
  'Leandro da Silva',
  'Éder Aleixo de Assis',
  'Serginho Chulapa',
  'Oscar dos Santos Emboaba',
  'Luizinho de Paula',

  // Era 1994 - Tetra Mundial
  'Romário de Souza Faria',
  'José Roberto Gama de Oliveira', // Bebeto
  'Raí Souza Vieira de Oliveira',
  'Marcos Evangelista de Moraes', // Cafu
  'Roberto Carlos da Silva Rocha',
  'Mazinho Oliveira',
  'Mauro Silva de Oliveira',
  'Branco Cláudio Ibrahim Vaz Leal',
  'Aldair Nascimento dos Santos',
  'Carlos Mozer Dunga',

  // Era 1998-2002 - Penta Mundial
  'Ronaldo Luís Nazário de Lima',
  'Rivaldo Vítor Borba Ferreira',
  'Denílson de Oliveira Araújo',
  'Leonardo Nascimento de Araújo',
  'Edmundo Alves de Souza Neto',
  'Djalminha Feitosa',
  'Giovanni Silva de Oliveira',
  'Emerson Ferreira da Rosa',
  'Zé Roberto da Silva Ferreira',
  'Gilberto Silva de Melo',

  // Lendas antigas (1958-1970)
  'Manuel Francisco dos Santos', // Garrincha
  'Waldir Pereira', // Didi
  'Nílton Santos de Souza',
  'Djalma Santos Pereira',
  'Mário Jorge Lobo Zagallo',
  'Edvaldo Izídio Neto', // Vavá
  'José Ely de Miranda', // Zito
  'Gilmar dos Santos Neves',
  'Mauro Ramos de Oliveira',
  'Oreco de Souza',

  // Mais jogadores 80s-90s
  'Ricardo Gomes de Oliveira',
  'Müller Luís Antônio Corrêa',
  'Careca Antônio de Oliveira',
  'Silas José de Oliveira',
  'Renato Gaúcho Portaluppi',
  'Josimar Higino Pereira',
  'Andrade de Oliveira Silva',
  'Paulo Sérgio da Silva',
  'César Sampaio dos Santos',
  'Flávio Conceição da Silva',

  // Geração 2000s
  'Ronaldinho de Assis Moreira',
  'Ricardo Izecson dos Santos', // Kaká
  'Adriano Leite Ribeiro',
  'Robson de Souza', // Robinho
  'Lúcio Ferreira Reis',
  'Juan Silveira dos Santos',
  'Luís Fabiano Clemente',
  'Maicon Douglas Sisenando',
  'Daniel Alves da Silva',
  'Julio César Soares de Espíndola',
];

// Gera data de nascimento aleatória entre 2008-2012 (para alunos do fundamental/médio)
function gerarDataNascimento(): Date {
  const anoBase = 2008 + Math.floor(Math.random() * 5); // 2008-2012
  const mes = Math.floor(Math.random() * 12);
  const dia = 1 + Math.floor(Math.random() * 28);
  return new Date(anoBase, mes, dia);
}

// Gera matrícula única
function gerarMatricula(turmaIndex: number, alunoIndex: number): string {
  const ano = new Date().getFullYear();
  return `${ano}${String(turmaIndex + 1).padStart(2, '0')}${String(alunoIndex + 1).padStart(3, '0')}`;
}

// Embaralha array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST() {
  try {
    // Buscar todas as turmas ativas
    const turmas = await turmaService.getAll();
    const turmasAtivas = turmas.filter(t => t.ativo);

    if (turmasAtivas.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma turma ativa encontrada',
      }, { status: 404 });
    }

    const resultados: { turma: string; alunosCriados: number }[] = [];
    let totalCriados = 0;

    // Embaralhar jogadores para distribuição aleatória
    let jogadoresDisponiveis = shuffleArray(jogadoresLendarios);

    for (let turmaIndex = 0; turmaIndex < turmasAtivas.length; turmaIndex++) {
      const turma = turmasAtivas[turmaIndex];

      // Se acabaram os jogadores, reinicia a lista embaralhada
      if (jogadoresDisponiveis.length < 20) {
        jogadoresDisponiveis = shuffleArray(jogadoresLendarios);
      }

      // Pegar 20 jogadores para esta turma
      const jogadoresTurma = jogadoresDisponiveis.splice(0, 20);

      let alunosCriados = 0;

      for (let alunoIndex = 0; alunoIndex < jogadoresTurma.length; alunoIndex++) {
        const nomeCompleto = jogadoresTurma[alunoIndex];

        try {
          await alunoService.create({
            nome: nomeCompleto,
            turmaId: turma.id,
            turma: turma.nome,
            serie: turma.serie,
            turno: turma.turno,
            matricula: gerarMatricula(turmaIndex, alunoIndex),
            dataNascimento: gerarDataNascimento(),
            ativo: true,
          });
          alunosCriados++;
          totalCriados++;
        } catch (error) {
          console.error(`Erro ao criar aluno ${nomeCompleto}:`, error);
        }
      }

      resultados.push({
        turma: `${turma.nome} (${turma.serie})`,
        alunosCriados,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${totalCriados} alunos criados em ${turmasAtivas.length} turmas`,
      detalhes: resultados,
    });

  } catch (error) {
    console.error('Erro ao popular alunos:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para popular as turmas com alunos fictícios',
    jogadoresDisponiveis: jogadoresLendarios.length,
  });
}
