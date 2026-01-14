/**
 * Tipos locais para o modulo de notas.
 */

import { NotaComposicao } from '@/types';

/**
 * Notas de um aluno para um bimestre.
 */
export interface NotasAluno {
  av1: number | null;
  av1Id?: string;
  av1Composicao?: NotaComposicao[];
  rp1: number | null;
  rp1Id?: string;
  av2: number | null;
  av2Id?: string;
  av2Composicao?: NotaComposicao[];
  rp2: number | null;
  rp2Id?: string;
}

/**
 * Modo de entrada de nota.
 * - bloqueado: celula nao editavel
 * - direto: usuario digita a nota diretamente
 * - composicao: nota calculada a partir de componentes
 */
export type ModoEntrada = 'bloqueado' | 'direto' | 'composicao';

/**
 * Configuracao de modo de uma celula.
 */
export interface ModoCell {
  modo: ModoEntrada;
  composicao?: NotaComposicao[];
}

/**
 * Template padrao de composicao.
 */
export const DEFAULT_TEMPLATE: NotaComposicao[] = [
  { id: '1', nome: 'Prova', porcentagem: 5, valor: null },
  { id: '2', nome: 'Trabalho', porcentagem: 3, valor: null },
  { id: '3', nome: 'Participacao', porcentagem: 2, valor: null },
];

/**
 * Gera chave unica para celula de nota.
 */
export function getCellKey(alunoId: string, av: 'av1' | 'av2'): string {
  return `${alunoId}_${av}`;
}

/**
 * Extrai alunoId e av de uma cellKey.
 */
export function parseCellKey(cellKey: string): { alunoId: string; av: 'av1' | 'av2' } {
  const [alunoId, av] = cellKey.split('_') as [string, 'av1' | 'av2'];
  return { alunoId, av };
}
