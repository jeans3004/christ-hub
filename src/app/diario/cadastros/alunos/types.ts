/**
 * Tipos e constantes para a pagina de alunos.
 */

import { TipoEnsino, Turno } from '@/types';

export interface AlunoForm {
  nome: string;
  cpf: string;
  dataNascimento: string;
  turmaId: string;
  matricula: string;
  // Campos para seleção hierárquica
  ensino: TipoEnsino;
  serie: string;
  turmaLetra: string;
  turno: Turno;
}

export const initialForm: AlunoForm = {
  nome: '',
  cpf: '',
  dataNascimento: '',
  turmaId: '',
  matricula: '',
  ensino: 'Ensino Fundamental II',
  serie: '6º Ano',
  turmaLetra: 'A',
  turno: 'Matutino',
};

export const avatarColors = [
  '#4CAF50', '#2196F3', '#9C27B0', '#FF9800',
  '#E91E63', '#00BCD4', '#FF5722', '#3F51B5',
];

// Constantes de seleção (mesmas do cadastro de turmas)
export const tiposEnsino: TipoEnsino[] = ['Ensino Fundamental II', 'Ensino Médio'];

export const turmasLetras = ['A', 'B', 'C'];

export const turnos: Turno[] = ['Matutino', 'Vespertino'];

export const seriesPorEnsino: Record<TipoEnsino, string[]> = {
  'Ensino Fundamental II': ['6º Ano', '7º Ano', '8º Ano', '9º Ano'],
  'Ensino Médio': ['1ª Série', '2ª Série', '3ª Série'],
};

export function generateTurmaNome(serie: string, turmaLetra: string, turno: string): string {
  return `${serie} ${turmaLetra} - ${turno}`;
}
