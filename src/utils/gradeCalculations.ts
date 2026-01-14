import { NotaComposicao } from '@/types';

/**
 * Calcula a soma de todos os componentes de composicao.
 * A nota final e a soma direta: NF = N1 + N2 + ... + Nn
 *
 * @param subNotas - Array de componentes com valores
 * @returns Soma das notas ou null se algum componente estiver vazio
 *
 * @example
 * const nota = calcularSomaComposicao([
 *   { id: '1', nome: 'Prova', porcentagem: 5, valor: 4.5 },
 *   { id: '2', nome: 'Trabalho', porcentagem: 3, valor: 2.8 },
 *   { id: '3', nome: 'Participacao', porcentagem: 2, valor: 1.7 },
 * ]);
 * // nota = 9.0
 */
export function calcularSomaComposicao(subNotas: NotaComposicao[]): number | null {
  if (subNotas.length === 0) return null;

  let soma = 0;
  for (const sub of subNotas) {
    if (sub.valor === null) return null;
    soma += sub.valor;
  }

  // Arredondar para 1 casa decimal
  return Math.round(soma * 10) / 10;
}

/**
 * Calcula a soma das notas maximas de um template.
 * O template deve somar 10 para ser valido.
 *
 * @param template - Array de componentes do template
 * @returns Soma das notas maximas (porcentagem)
 */
export function calcularSomaMaximas(template: NotaComposicao[]): number {
  return template.reduce((acc, t) => acc + t.porcentagem, 0);
}

/**
 * Verifica se um template de composicao e valido.
 * A soma dos valores maximos deve ser exatamente 10.
 *
 * @param template - Array de componentes do template
 * @returns true se a soma for 10
 */
export function validarTemplate(template: NotaComposicao[]): boolean {
  const soma = calcularSomaMaximas(template);
  return soma === 10;
}

/**
 * Dados para exibicao da formula de calculo.
 */
export interface DadosFormula {
  componentes: {
    nome: string;
    notaMaxima: number;
    nota: number | null;
  }[];
  todasPreenchidas: boolean;
  somaMaximas: number;
  somaNotas: number | null;
}

/**
 * Gera dados detalhados para exibicao da formula de calculo.
 *
 * @param subNotas - Array de componentes com valores
 * @returns Objeto com dados para exibicao ou null se vazio
 */
export function gerarDadosFormula(subNotas: NotaComposicao[]): DadosFormula | null {
  if (subNotas.length === 0) return null;

  const componentes = subNotas.map(sub => ({
    nome: sub.nome,
    notaMaxima: sub.porcentagem,
    nota: sub.valor,
  }));

  const todasPreenchidas = componentes.every(c => c.nota !== null);
  const somaMaximas = componentes.reduce((acc, c) => acc + c.notaMaxima, 0);
  const somaNotas = todasPreenchidas
    ? Math.round(componentes.reduce((acc, c) => acc + (c.nota || 0), 0) * 10) / 10
    : null;

  return { componentes, todasPreenchidas, somaMaximas, somaNotas };
}

/**
 * Calcula a media entre AV1 e AV2.
 * Se houver recuperacao (RP), usa a maior nota entre a original e a recuperacao.
 *
 * @param av1 - Nota da AV1
 * @param av2 - Nota da AV2
 * @param rp1 - Nota da recuperacao da AV1 (opcional)
 * @param rp2 - Nota da recuperacao da AV2 (opcional)
 * @returns Media calculada ou null se nenhuma nota disponivel
 */
export function calcularMedia(
  av1: number | null,
  av2: number | null,
  rp1?: number | null,
  rp2?: number | null
): number | null {
  // Usa a maior nota entre original e recuperacao
  const notaAv1 = av1 !== null
    ? (rp1 !== null && rp1 !== undefined && rp1 > av1 ? rp1 : av1)
    : (rp1 ?? null);

  const notaAv2 = av2 !== null
    ? (rp2 !== null && rp2 !== undefined && rp2 > av2 ? rp2 : av2)
    : (rp2 ?? null);

  const valores = [notaAv1, notaAv2].filter((v): v is number => v !== null);

  if (valores.length === 0) return null;

  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  return Math.round(media * 10) / 10;
}

/**
 * Formata uma nota para exibicao.
 *
 * @param valor - Valor da nota
 * @param casasDecimais - Numero de casas decimais (padrao: 1)
 * @returns Nota formatada ou '-' se null
 */
export function formatarNota(valor: number | null, casasDecimais = 1): string {
  if (valor === null) return '-';
  return valor.toFixed(casasDecimais);
}

/**
 * Verifica se uma nota e valida (entre 0 e o maximo permitido).
 *
 * @param valor - Valor a validar
 * @param maximo - Valor maximo permitido (padrao: 10)
 * @returns Objeto com resultado da validacao
 */
export function validarNota(
  valor: number | null,
  maximo = 10
): { valido: boolean; mensagem?: string } {
  if (valor === null) {
    return { valido: true }; // Null e permitido
  }

  if (valor < 0) {
    return { valido: false, mensagem: 'A nota nao pode ser negativa' };
  }

  if (valor > maximo) {
    return { valido: false, mensagem: `A nota maxima e ${maximo}` };
  }

  return { valido: true };
}

/**
 * Determina a cor de status baseada na nota.
 *
 * @param nota - Valor da nota
 * @param minAprovacao - Nota minima para aprovacao (padrao: 7)
 * @returns Cor para exibicao (success, warning, error, ou default)
 */
export function getCorNota(
  nota: number | null,
  minAprovacao = 7
): 'success' | 'warning' | 'error' | 'default' {
  if (nota === null) return 'default';
  if (nota >= minAprovacao) return 'success';
  if (nota >= 5) return 'warning';
  return 'error';
}

/**
 * Calcula a situacao do aluno baseada na media.
 *
 * @param media - Media do aluno
 * @param minAprovacao - Nota minima para aprovacao (padrao: 7)
 * @returns Situacao do aluno
 */
export function getSituacaoAluno(
  media: number | null,
  minAprovacao = 7
): 'aprovado' | 'recuperacao' | 'reprovado' | 'pendente' {
  if (media === null) return 'pendente';
  if (media >= minAprovacao) return 'aprovado';
  if (media >= 5) return 'recuperacao';
  return 'reprovado';
}

/**
 * Cria um novo componente de composicao com ID unico.
 *
 * @param nome - Nome do componente
 * @param notaMaxima - Nota maxima do componente
 * @returns Novo componente
 */
export function criarComponente(nome: string, notaMaxima: number): NotaComposicao {
  return {
    id: Date.now().toString(),
    nome,
    porcentagem: notaMaxima,
    valor: null,
  };
}

/**
 * Template padrao de composicao de notas.
 * Soma das notas maximas = 10
 */
export const TEMPLATE_PADRAO: NotaComposicao[] = [
  { id: '1', nome: 'Prova', porcentagem: 5, valor: null },
  { id: '2', nome: 'Trabalho', porcentagem: 3, valor: null },
  { id: '3', nome: 'Participacao', porcentagem: 2, valor: null },
];
