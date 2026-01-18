/**
 * Tipos e constantes para a pagina de professores.
 */

import { Usuario, UserRole, AuthStatus, Disciplina, Turma } from '@/types';

// Formulario de professor
export interface ProfessorFormData {
  nome: string;
  googleEmail: string;
  googleUid?: string;
  tipo: UserRole;
  disciplinaIds: string[];
  turmaIds: string[];
  hasAccess: boolean; // Toggle "Ja possui acesso"
}

export const initialFormData: ProfessorFormData = {
  nome: '',
  googleEmail: '',
  googleUid: '',
  tipo: 'professor',
  disciplinaIds: [],
  turmaIds: [],
  hasAccess: false,
};

// Filtro de professores
export interface ProfessorFiltro {
  nome: string;
  status: 'todos' | 'ativos' | 'pendentes' | 'inativos';
}

export const initialFiltro: ProfessorFiltro = {
  nome: '',
  status: 'todos',
};

// Linha da tabela com dados expandidos
export interface ProfessorTableRow extends Usuario {
  disciplinasNomes: string[];
  turmasNomes: string[];
  statusLabel: string;
  statusColor: 'success' | 'warning' | 'default';
}

// Helpers para status
export function getStatusInfo(usuario: Usuario): { label: string; color: 'success' | 'warning' | 'default' } {
  if (!usuario.ativo) {
    return { label: 'Inativo', color: 'default' };
  }
  if (usuario.authStatus === 'linked') {
    return { label: 'Ativo', color: 'success' };
  }
  return { label: 'Aguardando acesso', color: 'warning' };
}

// Transformar Usuario em ProfessorTableRow
export function toProfessorTableRow(
  usuario: Usuario,
  disciplinas: Disciplina[],
  turmas: Turma[]
): ProfessorTableRow {
  const disciplinasNomes = (usuario.disciplinaIds || [])
    .map(id => disciplinas.find(d => d.id === id)?.nome)
    .filter((nome): nome is string => !!nome);

  const turmasNomes = (usuario.turmaIds || [])
    .map(id => turmas.find(t => t.id === id)?.nome)
    .filter((nome): nome is string => !!nome);

  const { label, color } = getStatusInfo(usuario);

  return {
    ...usuario,
    disciplinasNomes,
    turmasNomes,
    statusLabel: label,
    statusColor: color,
  };
}

// Validacoes
export interface ValidationErrors {
  nome?: string;
  googleEmail?: string;
  googleUid?: string;
  disciplinaIds?: string;
}

export function validateForm(form: ProfessorFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!form.nome || form.nome.length < 3) {
    errors.nome = 'Nome deve ter no minimo 3 caracteres';
  }

  if (!form.googleEmail) {
    errors.googleEmail = 'E-mail e obrigatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.googleEmail)) {
    errors.googleEmail = 'Digite um e-mail valido';
  }

  if (form.hasAccess && !form.googleUid) {
    errors.googleUid = 'Informe o UID do Google';
  }

  if (form.disciplinaIds.length === 0) {
    errors.disciplinaIds = 'Selecione ao menos uma disciplina';
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
