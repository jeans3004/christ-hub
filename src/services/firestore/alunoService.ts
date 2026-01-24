/**
 * Servico de alunos.
 */

import { Aluno } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where, orderBy, db } from './base';
import { collection, getDocs, query, writeBatch, doc, Timestamp, limit } from 'firebase/firestore';

const COLLECTION = 'alunos';

export const alunoService = {
  get: (id: string) => getDocument<Aluno>(COLLECTION, id),
  getAll: () => getDocuments<Aluno>(COLLECTION, [orderBy('nome')]),
  getByTurma: (turmaId: string) =>
    getDocuments<Aluno>(COLLECTION, [where('turmaId', '==', turmaId), where('ativo', '==', true), orderBy('nome')]),
  getByEnsino: (ensino: string) =>
    getDocuments<Aluno>(COLLECTION, [where('ensino', '==', ensino), where('ativo', '==', true), orderBy('nome')]),
  getEnsinoMedio: () =>
    getDocuments<Aluno>(COLLECTION, [where('ensino', '==', 'Ensino Médio'), where('ativo', '==', true), orderBy('nome')]),
  create: (data: Omit<Aluno, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<Aluno>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),

  /**
   * Buscar aluno por matricula.
   */
  async findByMatricula(matricula: string): Promise<Aluno | null> {
    const alunosRef = collection(db, COLLECTION);
    const q = query(
      alunosRef,
      where('matricula', '==', matricula),
      where('ativo', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Aluno;
  },

  /**
   * Buscar aluno por nome (busca exata).
   */
  async findByNome(nome: string): Promise<Aluno | null> {
    const alunosRef = collection(db, COLLECTION);
    const q = query(
      alunosRef,
      where('nome', '==', nome),
      where('ativo', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Aluno;
  },

  /**
   * Buscar aluno por email ou matricula.
   */
  async findByEmailOrMatricula(identificador: string): Promise<Aluno | null> {
    // Tentar por matricula primeiro
    const byMatricula = await this.findByMatricula(identificador);
    if (byMatricula) return byMatricula;

    // Tentar por email do responsavel
    const alunosRef = collection(db, COLLECTION);
    const q = query(
      alunosRef,
      where('responsavelEmail', '==', identificador),
      where('ativo', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Aluno;
    }

    return null;
  },

  /**
   * Atualizar area do conhecimento de um aluno.
   */
  async updateAreaConhecimento(alunoId: string, areaConhecimentoId: string | null): Promise<void> {
    const alunoRef = doc(db, COLLECTION, alunoId);
    const batch = writeBatch(db);
    batch.update(alunoRef, {
      areaConhecimentoId: areaConhecimentoId || null,
      updatedAt: Timestamp.now(),
    });
    await batch.commit();
  },

  /**
   * Atualizar area de multiplos alunos (batch).
   */
  async updateAreasConhecimentoBatch(
    updates: Array<{ alunoId: string; areaConhecimentoId: string }>
  ): Promise<void> {
    const batch = writeBatch(db);
    const now = Timestamp.now();

    updates.forEach(({ alunoId, areaConhecimentoId }) => {
      const alunoRef = doc(db, COLLECTION, alunoId);
      batch.update(alunoRef, {
        areaConhecimentoId,
        updatedAt: now,
      });
    });

    await batch.commit();
  },

  /**
   * Estatisticas por area do conhecimento.
   */
  async getEstatisticasPorArea(turmaIds: string[]): Promise<Record<string, number>> {
    const stats: Record<string, number> = {
      linguagens: 0,
      matematica: 0,
      ciencias_natureza: 0,
      ciencias_humanas: 0,
      formacao_tecnica: 0,
      sem_area: 0,
    };

    const alunosPromises = turmaIds.map(id => this.getByTurma(id));
    const alunosArrays = await Promise.all(alunosPromises);
    const alunos = alunosArrays.flat();

    alunos.forEach(aluno => {
      const area = aluno.areaConhecimentoId || 'sem_area';
      stats[area] = (stats[area] || 0) + 1;
    });

    return stats;
  },
};
