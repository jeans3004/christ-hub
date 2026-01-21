/**
 * Servico de eventos da agenda.
 */

import { Evento } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where, orderBy } from './base';

const COLLECTION = 'eventos';

export const eventoService = {
  get: (id: string) => getDocument<Evento>(COLLECTION, id),

  getAll: () => getDocuments<Evento>(COLLECTION, [orderBy('data', 'desc')]),

  getAtivos: () =>
    getDocuments<Evento>(COLLECTION, [where('ativo', '==', true), orderBy('data', 'asc')]),

  getByPeriodo: (dataInicio: Date, dataFim: Date) =>
    getDocuments<Evento>(COLLECTION, [
      where('data', '>=', dataInicio),
      where('data', '<=', dataFim),
      where('ativo', '==', true),
    ]),

  getByMes: async (ano: number, mes: number) => {
    const dataInicio = new Date(ano, mes, 1);
    const dataFim = new Date(ano, mes + 1, 0, 23, 59, 59);
    return eventoService.getByPeriodo(dataInicio, dataFim);
  },

  getProximos: async (dias: number = 30) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataFim = new Date();
    dataFim.setDate(dataFim.getDate() + dias);
    dataFim.setHours(23, 59, 59, 999);
    return getDocuments<Evento>(COLLECTION, [
      where('data', '>=', hoje),
      where('data', '<=', dataFim),
      where('ativo', '==', true),
    ]);
  },

  getByTurma: (turmaId: string) =>
    getDocuments<Evento>(COLLECTION, [
      where('turmaIds', 'array-contains', turmaId),
      where('ativo', '==', true),
    ]),

  create: (data: Omit<Evento, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument(COLLECTION, data),

  update: (id: string, data: Partial<Evento>) =>
    updateDocument(COLLECTION, id, data),

  delete: (id: string) =>
    deleteDocument(COLLECTION, id),

  softDelete: (id: string) =>
    updateDocument(COLLECTION, id, { ativo: false }),
};
