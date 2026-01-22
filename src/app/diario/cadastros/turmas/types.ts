/**
 * Tipos e constantes para a pagina de turmas.
 */

import { Turno, TipoEnsino } from '@/types';

export interface TurmaForm {
  nome: string;
  serie: string;
  ensino: TipoEnsino;
  turma: string;
  turno: Turno;
  ano: number;
}

export const initialForm: TurmaForm = {
  nome: '',
  serie: '',
  ensino: 'Ensino Fundamental II',
  turma: 'A',
  turno: 'Matutino',
  ano: new Date().getFullYear(),
};

export const turnos: Turno[] = ['Matutino', 'Vespertino'];

export const turmasLetras = ['A', 'B', 'C'];

export const tiposEnsino: TipoEnsino[] = ['Ensino Fundamental II', 'Ensino Médio'];

export const seriesPorEnsino: Record<TipoEnsino, string[]> = {
  'Ensino Fundamental II': ['6º Ano', '7º Ano', '8º Ano', '9º Ano'],
  'Ensino Médio': ['1ª Série', '2ª Série', '3ª Série'],
};

export function generateNome(serie: string, turma: string, turno: string): string {
  return `${serie} ${turma} - ${turno}`;
}
