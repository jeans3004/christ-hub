/**
 * Tipos para composicao de notas.
 */

import { NotaComposicao, NivelRubrica } from '@/types';

/**
 * Detalhe de uma rubrica avaliada.
 */
export interface RubricaDetalhe {
  rubricaId: string;
  rubricaNome: string;
  nivel: NivelRubrica | null;
  valorMaximo: number;
  valorCalculado: number | null;
}

/**
 * Componente da formula com rubricas.
 */
export interface ComponenteFormula {
  nome: string;
  notaMaxima: number;
  nota: number | null;
  rubricas: RubricaDetalhe[];
  todasRubricasAvaliadas: boolean;
}

/**
 * Formula detalhada para calculo.
 */
export interface FormulaDetalhada {
  componentes: ComponenteFormula[];
  todasPreenchidas: boolean;
  somaMaximas: number;
  somaNotas: number | null;
}

/**
 * Props do modal de composicao.
 */
export interface ComposicaoModalProps {
  open: boolean;
  subNotas: NotaComposicao[];
  saving: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  onValorChange: (id: string, value: string) => void;
  getTotalValoresMax: () => number;
  calcularNotaComposicao: () => number | null;
  gerarFormulaDetalhada: () => FormulaDetalhada | null;
}

/**
 * Props do item de componente.
 */
export interface ComponenteItemProps {
  subNota: NotaComposicao;
  componenteFormula?: ComponenteFormula;
}

/**
 * Props do item de rubrica.
 */
export interface RubricaDetalheItemProps {
  rubrica: RubricaDetalhe;
}

/**
 * Props do display de formula.
 */
export interface FormulaDisplayProps {
  gerarFormulaDetalhada: () => FormulaDetalhada | null;
}

/**
 * Props das caixas de resumo.
 */
export interface SummaryBoxesProps {
  subNotasLength: number;
  totalMax: number;
  notaCalculada: number | null;
}
