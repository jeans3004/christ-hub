/**
 * Servico de alunos.
 */

import { Aluno } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where, orderBy } from './base';

const COLLECTION = 'alunos';

export const alunoService = {
  get: (id: string) => getDocument<Aluno>(COLLECTION, id),
  getAll: () => getDocuments<Aluno>(COLLECTION, [orderBy('nome')]),
  getByTurma: (turmaId: string) =>
    getDocuments<Aluno>(COLLECTION, [where('turmaId', '==', turmaId), where('ativo', '==', true), orderBy('nome')]),
  getByEnsino: (ensino: string) =>
    getDocuments<Aluno>(COLLECTION, [where('ensino', '==', ensino), where('ativo', '==', true), orderBy('nome')]),
  getEnsinoMedio: () =>
    getDocuments<Aluno>(COLLECTION, [where('ensino', '==', 'Ensino Médio'), where('ativo', '==', true), orderBy('nome')]),
  create: (data: Omit<Aluno, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<Aluno>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),
};
