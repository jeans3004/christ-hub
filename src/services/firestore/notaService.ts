/**
 * Servico de notas.
 */

import { Nota } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where } from './base';

const COLLECTION = 'notas';

export const notaService = {
  get: (id: string) => getDocument<Nota>(COLLECTION, id),

  getByAlunoTurmaDisciplina: (alunoId: string, turmaId: string, disciplinaId: string, ano: number) =>
    getDocuments<Nota>(COLLECTION, [
      where('alunoId', '==', alunoId),
      where('turmaId', '==', turmaId),
      where('disciplinaId', '==', disciplinaId),
      where('ano', '==', ano),
    ]),

  create: (data: Omit<Nota, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<Nota>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),
};
