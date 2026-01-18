/**
 * Servico de chamadas.
 */

import { Chamada } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where, Timestamp } from './base';

const COLLECTION = 'chamadas';

export const chamadaService = {
  get: (id: string) => getDocument<Chamada>(COLLECTION, id),

  getByTurmaData: async (turmaId: string, data: Date) => {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    return getDocuments<Chamada>(COLLECTION, [
      where('turmaId', '==', turmaId),
      where('data', '>=', Timestamp.fromDate(startOfDay)),
      where('data', '<=', Timestamp.fromDate(endOfDay)),
    ]);
  },

  getByTurmaAno: async (turmaId: string, ano: number) => {
    const startOfYear = new Date(ano, 0, 1);
    const endOfYear = new Date(ano, 11, 31, 23, 59, 59);

    return getDocuments<Chamada>(COLLECTION, [
      where('turmaId', '==', turmaId),
      where('data', '>=', Timestamp.fromDate(startOfYear)),
      where('data', '<=', Timestamp.fromDate(endOfYear)),
    ]);
  },

  create: (data: Omit<Chamada, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<Chamada>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),
};
