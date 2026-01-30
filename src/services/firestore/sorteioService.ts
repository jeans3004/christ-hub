/**
 * Servico de sorteios.
 */

import {
  getDocuments,
  createDocument,
  deleteDocument,
  where,
  orderBy,
  limit as fbLimit,
} from './base';

export interface Sorteio {
  id: string;
  turmaId: string;
  turmaNome: string;
  modo: 'individual' | 'multiplo' | 'equipes' | 'sequencia';
  configuracao: {
    quantidade?: number;
    alunosExcluidos?: string[];
  };
  resultado: {
    alunos?: { id: string; nome: string }[];
    equipes?: { nome: string; membros: { id: string; nome: string }[] }[];
  };
  totalAlunos: number;
  professorId: string;
  professorNome: string;
  createdAt: Date;
}

const COLLECTION = 'sorteios';

export const sorteioService = {
  create: (data: Omit<Sorteio, 'id' | 'createdAt'>) =>
    createDocument<Sorteio>(COLLECTION, data),

  getByTurma: (turmaId: string, limitCount?: number) =>
    getDocuments<Sorteio>(COLLECTION, [
      where('turmaId', '==', turmaId),
      orderBy('createdAt', 'desc'),
      ...(limitCount ? [fbLimit(limitCount)] : []),
    ]),

  getByProfessor: (professorId: string, limitCount?: number) =>
    getDocuments<Sorteio>(COLLECTION, [
      where('professorId', '==', professorId),
      orderBy('createdAt', 'desc'),
      ...(limitCount ? [fbLimit(limitCount)] : []),
    ]),

  remove: (id: string) => deleteDocument(COLLECTION, id),
};
