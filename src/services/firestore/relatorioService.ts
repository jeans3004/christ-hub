/**
 * Servico de relatorios de alunos.
 */

import { RelatorioAluno } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where, orderBy, QueryConstraint } from './base';

const COLLECTION = 'relatorios';

export const relatorioService = {
  get: (id: string) => getDocument<RelatorioAluno>(COLLECTION, id),

  getByAluno: (alunoId: string, ano?: number) => {
    const constraints: QueryConstraint[] = [where('alunoId', '==', alunoId)];
    if (ano) {
      constraints.push(where('ano', '==', ano));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    return getDocuments<RelatorioAluno>(COLLECTION, constraints);
  },

  getByProfessor: (professorId: string, ano?: number) => {
    const constraints: QueryConstraint[] = [where('professorId', '==', professorId)];
    if (ano) {
      constraints.push(where('ano', '==', ano));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    return getDocuments<RelatorioAluno>(COLLECTION, constraints);
  },

  getByTurma: (turmaId: string, ano?: number) => {
    const constraints: QueryConstraint[] = [where('turmaId', '==', turmaId)];
    if (ano) {
      constraints.push(where('ano', '==', ano));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    return getDocuments<RelatorioAluno>(COLLECTION, constraints);
  },

  create: (data: Omit<RelatorioAluno, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<RelatorioAluno>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),
};
