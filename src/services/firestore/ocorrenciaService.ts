/**
 * Servico de ocorrencias.
 */

import { Ocorrencia } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where, orderBy, Timestamp, QueryConstraint } from './base';

const COLLECTION = 'ocorrencias';

export const ocorrenciaService = {
  get: (id: string) => getDocument<Ocorrencia>(COLLECTION, id),

  getByStatus: (status: 'pendente' | 'aprovada' | 'cancelada', ano?: number) => {
    const constraints: QueryConstraint[] = [where('status', '==', status)];
    if (ano) {
      const startOfYear = new Date(ano, 0, 1);
      const endOfYear = new Date(ano, 11, 31, 23, 59, 59);
      constraints.push(
        where('data', '>=', Timestamp.fromDate(startOfYear)),
        where('data', '<=', Timestamp.fromDate(endOfYear))
      );
    }
    constraints.push(orderBy('data', 'desc'));
    return getDocuments<Ocorrencia>(COLLECTION, constraints);
  },

  getByAluno: (alunoId: string) =>
    getDocuments<Ocorrencia>(COLLECTION, [where('alunoId', '==', alunoId), orderBy('data', 'desc')]),

  create: (data: Omit<Ocorrencia, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<Ocorrencia>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),

  aprovar: (id: string, aprovadaPor: string) =>
    updateDocument<Ocorrencia>(COLLECTION, id, { status: 'aprovada', aprovadaPor, aprovadaEm: new Date() }),

  cancelar: (id: string, canceladaPor: string) =>
    updateDocument<Ocorrencia>(COLLECTION, id, { status: 'cancelada', canceladaPor, canceladaEm: new Date() }),
};
