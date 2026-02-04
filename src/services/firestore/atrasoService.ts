/**
 * Servico para gerenciamento de atrasos no Firestore.
 */

import { Atraso } from '@/types';
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
  Timestamp,
} from './base';

const COLLECTION = 'atrasos';

export const atrasoService = {
  // Buscar todos os atrasos
  getAll: async () => {
    return getDocuments<Atraso>(COLLECTION, [orderBy('data', 'desc')]);
  },

  // Buscar por ID
  getById: async (id: string) => {
    return getDocument<Atraso>(COLLECTION, id);
  },

  // Buscar por aluno
  getByAluno: async (alunoId: string) => {
    return getDocuments<Atraso>(COLLECTION, [
      where('alunoId', '==', alunoId),
      orderBy('data', 'desc'),
    ]);
  },

  // Buscar por turma
  getByTurma: async (turmaId: string) => {
    return getDocuments<Atraso>(COLLECTION, [
      where('turmaId', '==', turmaId),
      orderBy('data', 'desc'),
    ]);
  },

  // Buscar por data
  getByData: async (data: Date) => {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    return getDocuments<Atraso>(COLLECTION, [
      where('data', '>=', Timestamp.fromDate(startOfDay)),
      where('data', '<=', Timestamp.fromDate(endOfDay)),
    ]);
  },

  // Buscar por turma e data
  getByTurmaData: async (turmaId: string, data: Date) => {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    return getDocuments<Atraso>(COLLECTION, [
      where('turmaId', '==', turmaId),
      where('data', '>=', Timestamp.fromDate(startOfDay)),
      where('data', '<=', Timestamp.fromDate(endOfDay)),
    ]);
  },

  // Buscar por periodo
  getByPeriodo: async (dataInicio: Date, dataFim: Date) => {
    return getDocuments<Atraso>(COLLECTION, [
      where('data', '>=', Timestamp.fromDate(dataInicio)),
      where('data', '<=', Timestamp.fromDate(dataFim)),
    ]);
  },

  // Criar atraso
  create: async (data: Omit<Atraso, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createDocument<Atraso>(COLLECTION, {
      ...data,
      data: Timestamp.fromDate(data.data as Date) as unknown as Date,
    });
  },

  // Atualizar atraso
  update: async (id: string, data: Partial<Atraso>) => {
    const updateData = { ...data };
    if (data.data) {
      updateData.data = Timestamp.fromDate(data.data as Date) as unknown as Date;
    }
    return updateDocument<Atraso>(COLLECTION, id, updateData);
  },

  // Deletar atraso
  delete: async (id: string) => {
    return deleteDocument(COLLECTION, id);
  },
};
