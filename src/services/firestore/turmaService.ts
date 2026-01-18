/**
 * Servico de turmas.
 */

import { Turma } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where, orderBy } from './base';

const COLLECTION = 'turmas';

export const turmaService = {
  get: (id: string) => getDocument<Turma>(COLLECTION, id),
  getAll: () => getDocuments<Turma>(COLLECTION, [orderBy('nome')]),
  getByAno: (ano: number) =>
    getDocuments<Turma>(COLLECTION, [where('ano', '==', ano), where('ativo', '==', true), orderBy('nome')]),
  create: (data: Omit<Turma, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<Turma>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),
};
