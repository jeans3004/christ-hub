/**
 * Servico de professores.
 */

import { Professor } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where, orderBy } from './base';

const COLLECTION = 'professores';

export const professorService = {
  get: (id: string) => getDocument<Professor>(COLLECTION, id),
  getAll: () => getDocuments<Professor>(COLLECTION, [orderBy('nome')]),
  getAtivos: () => getDocuments<Professor>(COLLECTION, [where('ativo', '==', true), orderBy('nome')]),
  create: (data: Omit<Professor, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<Professor>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),
};
