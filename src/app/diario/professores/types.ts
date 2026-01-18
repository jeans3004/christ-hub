/**
 * Tipos e constantes para a pagina de professores.
 */

import { Professor } from '@/types';

export interface ProfessorFormData {
  nome: string;
  cpf: string;
  telefone: string;
  coordenador: boolean;
  disciplinas: string[];
}

export interface ProfessorFiltro {
  nome: string;
  cpf: string;
  telefone: string;
}

export const initialFormData: ProfessorFormData = {
  nome: '',
  cpf: '',
  telefone: '',
  coordenador: false,
  disciplinas: [],
};

export const initialFiltro: ProfessorFiltro = {
  nome: '',
  cpf: '',
  telefone: '',
};

export const mockDisciplinas = [
  'Matemática', 'Português', 'História', 'Geografia', 'Ciências',
  'Física', 'Química', 'Biologia', 'Inglês', 'Educação Física',
  'Artes', 'Filosofia', 'Sociologia',
];

export const mockProfessores: Professor[] = [
  {
    id: '1',
    nome: 'Carlos Alberto Cruz Pinto',
    cpf: '123.456.789-00',
    telefone: '(62) 99377-6304',
    coordenador: true,
    disciplinas: ['Matemática', 'Física'],
    turmas: [],
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    nome: 'Maria Silva Santos',
    cpf: '987.654.321-00',
    telefone: '(62) 98888-7777',
    coordenador: false,
    disciplinas: ['Português', 'Literatura'],
    turmas: [],
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
