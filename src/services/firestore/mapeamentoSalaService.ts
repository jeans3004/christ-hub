/**
 * Servico de mapeamento de sala.
 */

import { MapeamentoSala, LayoutSala, Assento } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where } from './base';

const COLLECTION = 'mapeamentosSala';

export const mapeamentoSalaService = {
  get: (id: string) => getDocument<MapeamentoSala>(COLLECTION, id),

  getByTurmaAno: async (turmaId: string, ano: number) =>
    getDocuments<MapeamentoSala>(COLLECTION, [where('turmaId', '==', turmaId), where('ano', '==', ano)]),

  getByProfessorAno: async (professorId: string, ano: number) =>
    getDocuments<MapeamentoSala>(COLLECTION, [where('professorId', '==', professorId), where('ano', '==', ano)]),

  getByTurmaProfessorAno: async (turmaId: string, professorId: string, ano: number) => {
    const docs = await getDocuments<MapeamentoSala>(COLLECTION, [
      where('turmaId', '==', turmaId),
      where('professorId', '==', professorId),
      where('ano', '==', ano),
    ]);
    return docs[0] || null;
  },

  create: (data: Omit<MapeamentoSala, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<MapeamentoSala>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),

  save: async (
    turmaId: string,
    professorId: string,
    ano: number,
    layout: LayoutSala,
    assentos: Assento[],
    nome?: string
  ): Promise<string> => {
    const existing = await mapeamentoSalaService.getByTurmaProfessorAno(turmaId, professorId, ano);

    if (existing) {
      await updateDocument(COLLECTION, existing.id, { layout, assentos, nome });
      return existing.id;
    } else {
      return createDocument(COLLECTION, { turmaId, professorId, ano, layout, assentos, nome });
    }
  },
};
