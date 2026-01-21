/**
 * Tipos do módulo de gerenciamento de usuários.
 */

import { Usuario, UserRole, Turma, Disciplina } from '@/types';

export interface UsuarioFormData {
  nome: string;
  cpf: string;
  email: string;
  googleEmail: string;
  telefone?: string;
  celular?: string;
  tipo: UserRole;
  turmaIds: string[];
  disciplinaIds: string[];
  ativo: boolean;
}

export interface UsuarioFilters {
  search: string;
  tipo: UserRole | 'todos';
  status: 'todos' | 'ativos' | 'inativos' | 'pendentes';
}

export interface UsuarioWithDetails extends Usuario {
  turmasNomes?: string[];
  disciplinasNomes?: string[];
}

export const STATUS_LABELS: Record<string, string> = {
  todos: 'Todos',
  ativos: 'Ativos',
  inativos: 'Inativos',
  pendentes: 'Pendentes de Vinculação',
};

export const TIPO_OPTIONS: { value: UserRole | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos os Tipos' },
  { value: 'professor', label: 'Professor' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'administrador', label: 'Administrador' },
];
