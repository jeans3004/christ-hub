/**
 * Servico para gerenciamento de atestados no Firestore.
 */

import { Atestado, StatusAtestado } from '@/types';
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

const COLLECTION = 'atestados';

export const atestadoService = {
  // Buscar todos os atestados
  getAll: async () => {
    return getDocuments<Atestado>(COLLECTION, [orderBy('dataInicio', 'desc')]);
  },

  // Buscar por ID
  getById: async (id: string) => {
    return getDocument<Atestado>(COLLECTION, id);
  },

  // Buscar por aluno
  getByAluno: async (alunoId: string) => {
    return getDocuments<Atestado>(COLLECTION, [
      where('alunoId', '==', alunoId),
      orderBy('dataInicio', 'desc'),
    ]);
  },

  // Buscar por turma
  getByTurma: async (turmaId: string) => {
    return getDocuments<Atestado>(COLLECTION, [
      where('turmaId', '==', turmaId),
      orderBy('dataInicio', 'desc'),
    ]);
  },

  // Buscar por status
  getByStatus: async (status: StatusAtestado) => {
    return getDocuments<Atestado>(COLLECTION, [
      where('status', '==', status),
      orderBy('dataInicio', 'desc'),
    ]);
  },

  // Buscar atestados vigentes para um aluno em uma data especifica
  getVigentesAluno: async (alunoId: string, data: Date) => {
    const dataCheck = new Date(data);
    dataCheck.setHours(12, 0, 0, 0);

    const atestados = await getDocuments<Atestado>(COLLECTION, [
      where('alunoId', '==', alunoId),
      where('status', '==', 'aprovado'),
    ]);

    // Filtrar localmente os que estao vigentes na data
    return atestados.filter(a => {
      const inicio = new Date(a.dataInicio);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(a.dataFim);
      fim.setHours(23, 59, 59, 999);
      return dataCheck >= inicio && dataCheck <= fim;
    });
  },

  // Buscar atestados vigentes para uma turma em uma data especifica
  getVigentesTurma: async (turmaId: string, data: Date) => {
    const dataCheck = new Date(data);
    dataCheck.setHours(12, 0, 0, 0);

    const atestados = await getDocuments<Atestado>(COLLECTION, [
      where('turmaId', '==', turmaId),
      where('status', '==', 'aprovado'),
    ]);

    // Filtrar localmente os que estao vigentes na data
    return atestados.filter(a => {
      const inicio = new Date(a.dataInicio);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(a.dataFim);
      fim.setHours(23, 59, 59, 999);
      return dataCheck >= inicio && dataCheck <= fim;
    });
  },

  // Criar atestado
  create: async (data: Omit<Atestado, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createDocument<Atestado>(COLLECTION, {
      ...data,
      dataInicio: Timestamp.fromDate(data.dataInicio as Date) as unknown as Date,
      dataFim: Timestamp.fromDate(data.dataFim as Date) as unknown as Date,
    });
  },

  // Atualizar atestado
  update: async (id: string, data: Partial<Atestado>) => {
    const updateData = { ...data };
    if (data.dataInicio) {
      updateData.dataInicio = Timestamp.fromDate(data.dataInicio as Date) as unknown as Date;
    }
    if (data.dataFim) {
      updateData.dataFim = Timestamp.fromDate(data.dataFim as Date) as unknown as Date;
    }
    return updateDocument<Atestado>(COLLECTION, id, updateData);
  },

  // Aprovar atestado
  aprovar: async (id: string, aprovadorId: string, aprovadorNome: string) => {
    return updateDocument<Atestado>(COLLECTION, id, {
      status: 'aprovado',
      aprovadoPorId: aprovadorId,
      aprovadoPorNome: aprovadorNome,
    });
  },

  // Rejeitar atestado
  rejeitar: async (id: string, aprovadorId: string, aprovadorNome: string, motivo: string) => {
    return updateDocument<Atestado>(COLLECTION, id, {
      status: 'rejeitado',
      aprovadoPorId: aprovadorId,
      aprovadoPorNome: aprovadorNome,
      motivoRejeicao: motivo,
    });
  },

  // Deletar atestado
  delete: async (id: string) => {
    return deleteDocument(COLLECTION, id);
  },
};
