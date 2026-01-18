/**
 * Servico de usuarios.
 */

import { Usuario } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where, limit } from './base';

const COLLECTION = 'usuarios';

export const usuarioService = {
  get: (id: string) => getDocument<Usuario>(COLLECTION, id),
  getAll: () => getDocuments<Usuario>(COLLECTION),
  getByEmail: async (email: string) => {
    const docs = await getDocuments<Usuario>(COLLECTION, [where('email', '==', email), limit(1)]);
    return docs[0] || null;
  },
  create: (data: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<Usuario>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),
};
