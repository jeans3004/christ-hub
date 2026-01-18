/**
 * Tipos e constantes para a pagina de turmas.
 */

import { Turno } from '@/types';

export interface TurmaForm {
  nome: string;
  serie: string;
  turno: Turno;
  ano: number;
}

export const initialForm: TurmaForm = {
  nome: '',
  serie: '',
  turno: 'Matutino',
  ano: new Date().getFullYear(),
};

export const turnos: Turno[] = ['Matutino', 'Vespertino', 'Noturno'];

export const series = [
  '6o Ano - Ensino Fundamental II',
  '7o Ano - Ensino Fundamental II',
  '8o Ano - Ensino Fundamental II',
  '9o Ano - Ensino Fundamental II',
  '1a Serie - Ensino Medio',
  '2a Serie - Ensino Medio',
  '3a Serie - Ensino Medio',
];

export function generateNome(serie: string, turno: Turno): string {
  const turnoLetter = turno.charAt(0);
  return `${serie} [ ${turno} ${turnoLetter} ]`;
}
