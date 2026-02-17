// src/services/firestore/conteudoService.ts
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
} from './base';
import type { ConteudoAula } from '@/types';

const COLLECTION = 'conteudos';

export const conteudoAulaService = {
  async getByTurmaAndDate(
    turmaId: string,
    disciplinaId: string,
    data: Date,
    ano: number
  ): Promise<ConteudoAula[]> {
    return getDocuments<ConteudoAula>(COLLECTION, [
      where('turmaId', '==', turmaId),
      where('disciplinaId', '==', disciplinaId),
      where('ano', '==', ano),
      where('data', '==', data),
      orderBy('tempo', 'asc'),
    ]);
  },

  async getByProfessorAndPeriod(
    professorId: string,
    ano: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<ConteudoAula[]> {
    const constraints = [
      where('professorId', '==', professorId),
      where('ano', '==', ano),
    ];
    if (startDate) constraints.push(where('data', '>=', startDate));
    if (endDate) constraints.push(where('data', '<=', endDate));
    constraints.push(orderBy('data', 'desc'));
    return getDocuments<ConteudoAula>(COLLECTION, constraints);
  },

  async create(data: Omit<ConteudoAula, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return createDocument(COLLECTION, data);
  },

  async update(id: string, data: Partial<ConteudoAula>): Promise<void> {
    return updateDocument(COLLECTION, id, data);
  },

  async delete(id: string): Promise<void> {
    return deleteDocument(COLLECTION, id);
  },
};
