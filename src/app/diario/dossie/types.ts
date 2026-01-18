/**
 * Tipos especificos da pagina de Dossie do Aluno.
 */

import { Aluno, AvaliacaoRubrica, Ocorrencia, NivelRubrica } from '@/types';

/**
 * Resumo de frequencia do aluno
 */
export interface FrequenciaResumo {
  totalAulas: number;
  presencas: number;
  faltas: number;
  percentualPresenca: number;
}

/**
 * Avaliacao de rubrica com detalhes adicionais
 */
export interface AvaliacaoRubricaComDetalhes extends AvaliacaoRubrica {
  rubricaNome: string;
  disciplinaNome: string;
  componenteNome?: string;
}

/**
 * Dados completos do dossie do aluno
 */
export interface AlunoDossie extends Aluno {
  turmaNome: string;
  frequencia: FrequenciaResumo;
  avaliacoes: AvaliacaoRubricaComDetalhes[];
  ocorrencias: Ocorrencia[];
}

/**
 * Estado do modal de detalhes
 */
export interface ModalState {
  open: boolean;
  alunoId: string | null;
  loading: boolean;
}

/**
 * Filtros da pagina de dossie
 */
export interface DossieFiltros {
  ano: number;
  turmaId: string;
}

/**
 * Cores dos niveis de rubrica
 */
export const NIVEL_COLORS: Record<NivelRubrica, { bg: string; text: string }> = {
  A: { bg: '#e8f5e9', text: '#2e7d32' },
  B: { bg: '#e3f2fd', text: '#1565c0' },
  C: { bg: '#fff3e0', text: '#e65100' },
  D: { bg: '#fce4ec', text: '#c2185b' },
  E: { bg: '#ffebee', text: '#c62828' },
};

/**
 * Descricoes dos niveis de rubrica
 */
export const NIVEL_DESCRICOES: Record<NivelRubrica, string> = {
  A: 'Excelente',
  B: 'Bom',
  C: 'Regular',
  D: 'Insuficiente',
  E: 'Muito Insuficiente',
};
