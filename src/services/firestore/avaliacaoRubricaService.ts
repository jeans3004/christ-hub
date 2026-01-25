/**
 * Servico de avaliacoes por rubricas.
 */

import { AvaliacaoRubrica, TipoAv } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where, orderBy } from './base';

const COLLECTION = 'avaliacoesRubricas';

export const avaliacaoRubricaService = {
  get: (id: string) => getDocument<AvaliacaoRubrica>(COLLECTION, id),

  getByTurmaBimestre: (turmaId: string, bimestre: number, ano: number) =>
    getDocuments<AvaliacaoRubrica>(COLLECTION, [
      where('turmaId', '==', turmaId),
      where('bimestre', '==', bimestre),
      where('ano', '==', ano),
    ]),

  getByTurmaBimestreAv: (turmaId: string, bimestre: number, ano: number, av: TipoAv) =>
    getDocuments<AvaliacaoRubrica>(COLLECTION, [
      where('turmaId', '==', turmaId),
      where('bimestre', '==', bimestre),
      where('ano', '==', ano),
      where('av', '==', av),
    ]),

  getByAluno: (alunoId: string, ano: number) =>
    getDocuments<AvaliacaoRubrica>(COLLECTION, [where('alunoId', '==', alunoId), where('ano', '==', ano)]),

  getByAlunoCompleto: (alunoId: string) =>
    getDocuments<AvaliacaoRubrica>(COLLECTION, [where('alunoId', '==', alunoId), orderBy('ano', 'desc')]),

  getByAlunoBimestre: (alunoId: string, bimestre: number, ano: number) =>
    getDocuments<AvaliacaoRubrica>(COLLECTION, [
      where('alunoId', '==', alunoId),
      where('bimestre', '==', bimestre),
      where('ano', '==', ano),
    ]),

  create: (data: Omit<AvaliacaoRubrica, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<AvaliacaoRubrica>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),
};
