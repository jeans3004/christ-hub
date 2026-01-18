/**
 * Tipos e constantes para a pagina de disciplinas.
 */

import { Disciplina } from '@/types';

// Formulario de disciplina
export interface DisciplinaForm {
  nome: string;
  codigo: string;
  turmaIds: string[];
  parentId: string | null;
  isGroup: boolean;
}

export const initialForm: DisciplinaForm = {
  nome: '',
  codigo: '',
  turmaIds: [],
  parentId: null,
  isGroup: false,
};

// Hierarquia de disciplinas
export interface DisciplinaNode extends Disciplina {
  children: DisciplinaNode[];
  level: number;
  hasChildren: boolean;
  path: string; // Caminho completo: "Pai > Filho"
}

export interface DisciplinaTreeState {
  expanded: string[];
  selected: string | null;
}

// Limite de profundidade da hierarquia
export const MAX_DEPTH = 3;

// Modos de visualizacao
export type ViewMode = 'tree' | 'table';

// Opcao de exclusao de filhos
export type DeleteChildrenAction = 'move_to_root' | 'delete_all';
