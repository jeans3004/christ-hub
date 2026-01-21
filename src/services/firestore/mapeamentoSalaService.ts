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

  getByTurmaProfessorDisciplinaAno: async (turmaId: string, professorId: string, ano: number, disciplinaId?: string) => {
    // Se não tem disciplinaId, busca mapeamento genérico (sem disciplina)
    const constraints = [
      where('turmaId', '==', turmaId),
      where('professorId', '==', professorId),
      where('ano', '==', ano),
    ];

    const docs = await getDocuments<MapeamentoSala>(COLLECTION, constraints);

    // Filtra por disciplinaId (ou por mapeamentos sem disciplina se disciplinaId não for informado)
    if (disciplinaId) {
      return docs.find(d => d.disciplinaId === disciplinaId) || null;
    }
    // Se não foi passado disciplinaId, retorna o primeiro mapeamento sem disciplina ou o primeiro disponível
    return docs.find(d => !d.disciplinaId) || docs[0] || null;
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
    nome?: string,
    disciplinaId?: string
  ): Promise<string> => {
    const existing = await mapeamentoSalaService.getByTurmaProfessorDisciplinaAno(turmaId, professorId, ano, disciplinaId);

    const data = {
      layout,
      assentos,
      nome,
      ...(disciplinaId && { disciplinaId }),
    };

    if (existing) {
      await updateDocument(COLLECTION, existing.id, data);
      return existing.id;
    } else {
      return createDocument(COLLECTION, { turmaId, professorId, ano, ...data });
    }
  },
};
