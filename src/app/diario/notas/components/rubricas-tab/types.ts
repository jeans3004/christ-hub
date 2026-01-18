/**
 * Tipos para aba de rubricas.
 */

import { Rubrica, TipoRubrica } from '@/types';

/**
 * Props da aba de rubricas.
 */
export interface RubricasTabProps {
  rubricas: Rubrica[];
  loading: boolean;
  onRefresh: () => void;
}

/**
 * Grupo de rubricas.
 */
export interface GrupoRubricas {
  nome: string;
  tipo: 'geral' | 'professor';
  criadorId?: string;
  rubricas: Rubrica[];
}

/**
 * Props do cabecalho do grupo.
 */
export interface GrupoHeaderProps {
  grupo: GrupoRubricas;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Props do item de rubrica.
 */
export interface RubricaItemProps {
  rubrica: Rubrica;
  canEdit: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Props do cabecalho da aba.
 */
export interface RubricasTabHeaderProps {
  showInitButton: boolean;
  initializing: boolean;
  onInitialize: () => void;
  onAddNew: () => void;
}
