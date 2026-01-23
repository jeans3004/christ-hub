/**
 * Servico de chamadas de Trilhas (Novo Ensino Medio).
 */

import { ChamadaTrilha, PresencaAlunoTrilha, SerieEnsinoMedioTrilha } from '@/types';
import { getDocument, getDocuments, updateDocument, where, Timestamp } from './base';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COLLECTION = 'chamadaTrilhas';

// Gera ID unico para chamada: ano_areaId_serie_data
function generateChamadaId(ano: number, areaId: string, serie: string, data: string): string {
  const serieNorm = serie.replace(/[ªº\s]/g, '').toLowerCase();
  return `${ano}_${areaId}_${serieNorm}_${data}`;
}

export interface ChamadaTrilhaInput {
  data: Date;
  ano: number;
  areaConhecimentoId: string;
  serie: SerieEnsinoMedioTrilha;
  professorId: string;
  professorNome: string;
  presencas: PresencaAlunoTrilha[];
  conteudo?: string;
  realizada: boolean;
  observacao?: string;
}

export const chamadaTrilhaService = {
  get: (id: string) => getDocument<ChamadaTrilha>(COLLECTION, id),

  getByData: async (data: Date, ano: number): Promise<ChamadaTrilha[]> => {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    return getDocuments<ChamadaTrilha>(COLLECTION, [
      where('ano', '==', ano),
      where('data', '>=', Timestamp.fromDate(startOfDay)),
      where('data', '<=', Timestamp.fromDate(endOfDay)),
    ]);
  },

  getByAreaData: async (areaId: string, data: Date, ano: number): Promise<ChamadaTrilha[]> => {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    return getDocuments<ChamadaTrilha>(COLLECTION, [
      where('areaConhecimentoId', '==', areaId),
      where('ano', '==', ano),
      where('data', '>=', Timestamp.fromDate(startOfDay)),
      where('data', '<=', Timestamp.fromDate(endOfDay)),
    ]);
  },

  getByPeriodo: async (inicio: Date, fim: Date, ano: number): Promise<ChamadaTrilha[]> => {
    const start = new Date(inicio);
    start.setHours(0, 0, 0, 0);
    const end = new Date(fim);
    end.setHours(23, 59, 59, 999);

    return getDocuments<ChamadaTrilha>(COLLECTION, [
      where('ano', '==', ano),
      where('data', '>=', Timestamp.fromDate(start)),
      where('data', '<=', Timestamp.fromDate(end)),
    ]);
  },

  getByProfessorPeriodo: async (professorId: string, inicio: Date, fim: Date): Promise<ChamadaTrilha[]> => {
    const start = new Date(inicio);
    start.setHours(0, 0, 0, 0);
    const end = new Date(fim);
    end.setHours(23, 59, 59, 999);

    return getDocuments<ChamadaTrilha>(COLLECTION, [
      where('professorId', '==', professorId),
      where('data', '>=', Timestamp.fromDate(start)),
      where('data', '<=', Timestamp.fromDate(end)),
    ]);
  },

  upsert: async (input: ChamadaTrilhaInput): Promise<string> => {
    const dataStr = input.data.toISOString().split('T')[0];
    const id = generateChamadaId(input.ano, input.areaConhecimentoId, input.serie, dataStr);
    const now = new Date();

    const docRef = doc(db, COLLECTION, id);
    const data: Omit<ChamadaTrilha, 'id'> = {
      ...input,
      data: input.data,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, data, { merge: true });
    return id;
  },

  upsertBatch: async (inputs: ChamadaTrilhaInput[]): Promise<string[]> => {
    if (inputs.length === 0) return [];

    const batch = writeBatch(db);
    const ids: string[] = [];
    const now = new Date();

    for (const input of inputs) {
      const dataStr = input.data.toISOString().split('T')[0];
      const id = generateChamadaId(input.ano, input.areaConhecimentoId, input.serie, dataStr);
      ids.push(id);

      const docRef = doc(db, COLLECTION, id);
      const data: Omit<ChamadaTrilha, 'id'> = {
        ...input,
        data: input.data,
        createdAt: now,
        updatedAt: now,
      };

      batch.set(docRef, data, { merge: true });
    }

    await batch.commit();
    return ids;
  },

  marcarNaoRealizada: async (
    areaId: string,
    serie: SerieEnsinoMedioTrilha,
    data: Date,
    ano: number,
    professorId: string,
    professorNome: string,
    observacao?: string
  ): Promise<string> => {
    const dataStr = data.toISOString().split('T')[0];
    const id = generateChamadaId(ano, areaId, serie, dataStr);
    const now = new Date();

    const docRef = doc(db, COLLECTION, id);
    const docData: Omit<ChamadaTrilha, 'id'> = {
      data,
      ano,
      areaConhecimentoId: areaId,
      serie,
      professorId,
      professorNome,
      presencas: [],
      realizada: false,
      observacao,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, docData, { merge: true });
    return id;
  },

  update: (id: string, data: Partial<ChamadaTrilha>) => updateDocument(COLLECTION, id, data),
};
