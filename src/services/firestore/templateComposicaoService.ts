/**
 * Servico de templates de composicao.
 */

import { TemplateComposicao, NotaComposicao } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where } from './base';

const COLLECTION = 'templatesComposicao';

export const templateComposicaoService = {
  get: (id: string) => getDocument<TemplateComposicao>(COLLECTION, id),

  getByTurmaDisciplinaBimestreAv: async (
    turmaId: string,
    disciplinaId: string,
    bimestre: number,
    av: 'av1' | 'av2',
    ano: number
  ): Promise<TemplateComposicao | null> => {
    const docs = await getDocuments<TemplateComposicao>(COLLECTION, [
      where('turmaId', '==', turmaId),
      where('disciplinaId', '==', disciplinaId),
      where('bimestre', '==', bimestre),
      where('av', '==', av),
      where('ano', '==', ano),
    ]);
    return docs.length > 0 ? docs[0] : null;
  },

  getByTurmaDisciplinaBimestre: async (
    turmaId: string,
    disciplinaId: string,
    bimestre: number,
    ano: number
  ): Promise<{ av1: TemplateComposicao | null; av2: TemplateComposicao | null }> => {
    const docs = await getDocuments<TemplateComposicao>(COLLECTION, [
      where('turmaId', '==', turmaId),
      where('disciplinaId', '==', disciplinaId),
      where('bimestre', '==', bimestre),
      where('ano', '==', ano),
    ]);
    return {
      av1: docs.find((d) => d.av === 'av1') || null,
      av2: docs.find((d) => d.av === 'av2') || null,
    };
  },

  save: async (
    turmaId: string,
    disciplinaId: string,
    bimestre: number,
    av: 'av1' | 'av2',
    ano: number,
    componentes: NotaComposicao[]
  ): Promise<string> => {
    const existing = await templateComposicaoService.getByTurmaDisciplinaBimestreAv(turmaId, disciplinaId, bimestre, av, ano);

    if (existing) {
      await updateDocument(COLLECTION, existing.id, { componentes });
      return existing.id;
    } else {
      return createDocument(COLLECTION, { turmaId, disciplinaId, bimestre, av, ano, componentes });
    }
  },

  delete: (id: string) => deleteDocument(COLLECTION, id),
};
