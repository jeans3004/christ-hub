/**
 * Servico Firestore para configuracao do e-aluno (SGE externo).
 * Armazena credenciais criptografadas e mapeamentos por usuario.
 */

import {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  where,
} from './base';
import { EAlunoConfig } from '@/types';

const COLLECTION = 'eAlunoConfig';

export const eAlunoConfigService = {
  /**
   * Buscar config por userId.
   */
  async getByUser(userId: string): Promise<EAlunoConfig | null> {
    const docs = await getDocuments<EAlunoConfig>(COLLECTION, [
      where('userId', '==', userId),
    ]);
    return docs.length > 0 ? docs[0] : null;
  },

  /**
   * Buscar config por ID.
   */
  async get(id: string): Promise<EAlunoConfig | null> {
    return getDocument<EAlunoConfig>(COLLECTION, id);
  },

  /**
   * Criar nova config.
   */
  async create(data: Omit<EAlunoConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return createDocument(COLLECTION, {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },

  /**
   * Atualizar config existente.
   */
  async update(id: string, data: Partial<EAlunoConfig>): Promise<void> {
    return updateDocument(COLLECTION, id, {
      ...data,
      updatedAt: new Date(),
    });
  },

  /**
   * Salvar ou atualizar config do usuario (upsert).
   */
  async saveForUser(
    userId: string,
    data: Partial<Omit<EAlunoConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<string> {
    const existing = await this.getByUser(userId);

    if (existing) {
      await this.update(existing.id, data);
      return existing.id;
    }

    return this.create({
      userId,
      credentials: data.credentials || { user: '', password: '' },
      turmaMap: data.turmaMap || {},
      disciplinaMap: data.disciplinaMap || {},
      alunoMap: data.alunoMap || {},
      ...data,
    });
  },

  /**
   * Salvar mapeamento de alunos (merge com existente).
   */
  async saveAlunoMap(userId: string, newMappings: Record<string, number>): Promise<void> {
    const config = await this.getByUser(userId);
    if (!config) return;

    const mergedMap = { ...config.alunoMap, ...newMappings };
    await this.update(config.id, { alunoMap: mergedMap });
  },

  /**
   * Salvar mapeamento de turma.
   */
  async saveTurmaMap(
    userId: string,
    luminarTurmaId: string,
    eAlunoData: { serie: number; turma: number; turno: string }
  ): Promise<void> {
    const config = await this.getByUser(userId);
    if (!config) return;

    const turmaMap = { ...config.turmaMap, [luminarTurmaId]: eAlunoData };
    await this.update(config.id, { turmaMap });
  },

  /**
   * Salvar mapeamento de disciplina.
   */
  async saveDisciplinaMap(
    userId: string,
    luminarDisciplinaId: string,
    eAlunoDisciplinaId: number
  ): Promise<void> {
    const config = await this.getByUser(userId);
    if (!config) return;

    const disciplinaMap = { ...config.disciplinaMap, [luminarDisciplinaId]: eAlunoDisciplinaId };
    await this.update(config.id, { disciplinaMap });
  },
};
