/**
 * Servico de conceitos.
 */

import { Conceito } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where } from './base';

const COLLECTION = 'conceitos';

export const conceitoService = {
  get: (id: string) => getDocument<Conceito>(COLLECTION, id),

  getByAlunoMes: (alunoId: string, mes: string, ano: number) =>
    getDocuments<Conceito>(COLLECTION, [
      where('alunoId', '==', alunoId),
      where('mes', '==', mes),
      where('ano', '==', ano),
    ]),

  create: (data: Omit<Conceito, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<Conceito>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),
};
