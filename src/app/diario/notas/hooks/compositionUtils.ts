/**
 * Utilitarios para calculo de composicao.
 */

import { NotaComposicao, AvaliacaoRubrica, NivelRubrica } from '@/types';
import { NIVEL_PERCENTUAL, RubricaInfo, RubricaDetalhe, ComponenteFormula, FormulaDetalhada } from './compositionTypes';

/**
 * Obter avaliacao de um aluno em uma rubrica para um componente especifico.
 */
export function getAvaliacaoAluno(
  avaliacoes: AvaliacaoRubrica[],
  alunoId: string,
  rubricaId: string,
  componenteId: string
): NivelRubrica | null {
  const avaliacao = avaliacoes.find(
    (a) => a.alunoId === alunoId && a.rubricaId === rubricaId && a.componenteId === componenteId
  );
  return avaliacao?.nivel || null;
}

/**
 * Obter nome da rubrica.
 */
export function getRubricaNome(rubricas: RubricaInfo[], rubricaId: string): string {
  return rubricas.find((r) => r.id === rubricaId)?.nome || 'Rubrica';
}

/**
 * Calcular valor de um componente baseado nas avaliacoes de rubricas.
 */
export function calcularValorComponente(
  componente: NotaComposicao,
  alunoId: string,
  avaliacoes: AvaliacaoRubrica[],
  rubricas: RubricaInfo[]
): { valor: number | null; detalhes: RubricaDetalhe[] } {
  const rubricaIds = componente.rubricaIds || [];

  if (rubricaIds.length === 0) {
    return { valor: null, detalhes: [] };
  }

  const valorPorRubrica = componente.porcentagem / componente.quantidadeRubricas;
  let somaValores = 0;
  let todasAvaliadas = true;
  const detalhes: RubricaDetalhe[] = [];

  for (const rubricaId of rubricaIds) {
    const nivel = getAvaliacaoAluno(avaliacoes, alunoId, rubricaId, componente.id);
    const rubricaNome = getRubricaNome(rubricas, rubricaId);

    if (nivel === null) {
      todasAvaliadas = false;
      detalhes.push({
        rubricaId,
        rubricaNome,
        nivel: null,
        valorMaximo: valorPorRubrica,
        valorCalculado: null,
      });
    } else {
      const valorCalculado = Math.round(valorPorRubrica * NIVEL_PERCENTUAL[nivel] * 100) / 100;
      somaValores += valorCalculado;
      detalhes.push({
        rubricaId,
        rubricaNome,
        nivel,
        valorMaximo: valorPorRubrica,
        valorCalculado,
      });
    }
  }

  return {
    valor: todasAvaliadas ? Math.round(somaValores * 100) / 100 : null,
    detalhes,
  };
}

/**
 * Gerar formula detalhada.
 */
export function gerarFormula(
  subNotas: NotaComposicao[],
  alunoId: string,
  avaliacoes: AvaliacaoRubrica[],
  rubricas: RubricaInfo[]
): FormulaDetalhada {
  const componentes: ComponenteFormula[] = subNotas.map((sub) => {
    const { detalhes } = calcularValorComponente(sub, alunoId, avaliacoes, rubricas);
    const todasRubricasAvaliadas = detalhes.length > 0 && detalhes.every((d) => d.nivel !== null);
    return {
      nome: sub.nome,
      notaMaxima: sub.porcentagem,
      nota: sub.valor,
      rubricas: detalhes,
      todasRubricasAvaliadas,
    };
  });

  const todasPreenchidas = componentes.every((c) => c.nota !== null);
  const somaMaximas = componentes.reduce((acc, c) => acc + c.notaMaxima, 0);
  const somaNotas = todasPreenchidas
    ? Math.round(componentes.reduce((acc, c) => acc + (c.nota || 0), 0) * 10) / 10
    : null;

  return { componentes, todasPreenchidas, somaMaximas, somaNotas };
}

/**
 * Calcular nota total da composicao.
 */
export function calcularNota(subNotas: NotaComposicao[]): number | null {
  if (subNotas.length === 0) return null;

  let somaNotas = 0;
  for (const sub of subNotas) {
    if (sub.valor === null) return null;
    somaNotas += sub.valor;
  }
  return Math.round(somaNotas * 10) / 10;
}

/**
 * Total de valores maximos.
 */
export function getTotalMax(subNotas: NotaComposicao[]): number {
  return subNotas.reduce((acc, s) => acc + s.porcentagem, 0);
}
