/**
 * Tipos para hook de composicao de notas.
 */

import { NotaComposicao, AvaliacaoRubrica, NivelRubrica } from '@/types';
import type { NotasAluno, ModoCell } from '../types';
import type { RubricaDetalhe, ComponenteFormula, FormulaDetalhada } from '../components/composicao';

/**
 * Mapeamento de nivel para porcentagem.
 */
export const NIVEL_PERCENTUAL: Record<NivelRubrica, number> = {
  A: 1.0,
  B: 0.8,
  C: 0.6,
  D: 0.4,
  E: 0.2,
};

/**
 * Info basica de rubrica.
 */
export interface RubricaInfo {
  id: string;
  nome: string;
}

/**
 * Parametros do hook.
 */
export interface UseNotasCompositionParams {
  serieId: string;
  disciplinaId: string;
  bimestre: number;
  ano: number;
  notas: Record<string, NotasAluno>;
  setNotas: React.Dispatch<React.SetStateAction<Record<string, NotasAluno>>>;
  modosCells: Record<string, ModoCell>;
  setModosCells: React.Dispatch<React.SetStateAction<Record<string, ModoCell>>>;
  getTemplate: (av: 'av1' | 'av2') => NotaComposicao[];
  avaliacoes: AvaliacaoRubrica[];
  rubricas: RubricaInfo[];
}

/**
 * Status da composicao para exibicao na celula.
 */
export type ComposicaoStatus = 'sem-template' | 'falta-avaliar' | 'pronto';

/**
 * Retorno do hook.
 */
export interface UseNotasCompositionReturn {
  notasModalOpen: boolean;
  editingCellKey: string | null;
  subNotas: NotaComposicao[];
  savingComposicao: boolean;
  openCompositionModal: (cellKey: string) => void;
  closeCompositionModal: () => void;
  handleSubNotaValorChange: (id: string, value: string) => void;
  getTotalValoresMax: () => number;
  calcularNotaComposicao: () => number | null;
  gerarFormulaDetalhada: () => FormulaDetalhada | null;
  handleSaveNotasComposicao: () => Promise<void>;
  getComposicaoStatus: (alunoId: string, av: 'av1' | 'av2') => ComposicaoStatus;
}

// Re-export types for convenience
export type { RubricaDetalhe, ComponenteFormula, FormulaDetalhada };
