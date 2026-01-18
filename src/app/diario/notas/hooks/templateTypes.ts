/**
 * Tipos para hook de templates.
 */

import { NotaComposicao } from '@/types';

/**
 * Props do hook de templates.
 */
export interface UseNotasTemplatesProps {
  turmaId: string;
  disciplinaId: string;
  bimestre: number;
  ano: number;
}

/**
 * Estado da nova sub-nota.
 */
export interface NovaSubNotaState {
  nome: string;
  porcentagem: number;
  quantidadeRubricas: 1 | 2 | 3;
}

/**
 * Retorno do hook de templates.
 */
export interface UseNotasTemplatesReturn {
  templateAv1: NotaComposicao[];
  templateAv2: NotaComposicao[];
  templateModalOpen: boolean;
  editingTemplateAv: 'av1' | 'av2' | null;
  templateSubNotas: NotaComposicao[];
  novaSubNota: NovaSubNotaState;
  setNovaSubNota: React.Dispatch<React.SetStateAction<NovaSubNotaState>>;
  loadingTemplates: boolean;
  handleOpenTemplateModal: (av: 'av1' | 'av2') => void;
  handleCloseTemplateModal: () => void;
  handleSaveTemplate: () => Promise<void>;
  handleAddTemplateSubNota: () => void;
  handleRemoveTemplateSubNota: (id: string) => void;
  handleTemplateSubNotaPorcentagemChange: (id: string, value: string) => void;
  handleTemplateSubNotaRubricasChange: (id: string, value: 1 | 2 | 3) => void;
  getTemplate: (av: 'av1' | 'av2') => NotaComposicao[];
  getTemplateSoma: () => number;
}

/**
 * Helper para copia profunda do template.
 */
export const deepCopyTemplate = (template: NotaComposicao[]): NotaComposicao[] => {
  return template.map((item) => ({ ...item }));
};

/**
 * Valor inicial da nova sub-nota.
 */
export const INITIAL_NOVA_SUBNOTA: NovaSubNotaState = {
  nome: '',
  porcentagem: 0,
  quantidadeRubricas: 1,
};
