/**
 * Servico de rubricas.
 */

import { Rubrica } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where, orderBy } from './base';

const COLLECTION = 'rubricas';

export const rubricaService = {
  get: (id: string) => getDocument<Rubrica>(COLLECTION, id),
  getAll: () => getDocuments<Rubrica>(COLLECTION, [where('ativo', '==', true), orderBy('ordem', 'asc')]),
  getAllIncludingInactive: () => getDocuments<Rubrica>(COLLECTION, [orderBy('ordem', 'asc')]),
  create: (data: Omit<Rubrica, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<Rubrica>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),
};
