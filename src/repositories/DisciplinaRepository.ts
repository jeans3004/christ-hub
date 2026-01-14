import { DocumentData } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import { Disciplina } from '@/types';

/**
 * Repositorio para operacoes com Disciplinas.
 */
class DisciplinaRepositoryClass extends BaseRepository<Disciplina> {
  protected collectionName = 'disciplinas';

  protected fromFirestore(data: DocumentData, id: string): Disciplina {
    return {
      id,
      nome: data.nome || '',
      codigo: data.codigo,
      turmaIds: data.turmaIds || [],
      ativo: data.ativo ?? true,
      createdAt: this.convertTimestamp(data.createdAt),
      updatedAt: this.convertTimestamp(data.updatedAt),
    };
  }

  /**
   * Busca disciplinas ativas.
   */
  async getAtivas(): Promise<Disciplina[]> {
    return this.findWhere([
      { field: 'ativo', operator: '==', value: true },
    ], { orderByField: 'nome' });
  }

  /**
   * Busca disciplinas vinculadas a uma turma.
   */
  async getByTurma(turmaId: string): Promise<Disciplina[]> {
    const todas = await this.getAtivas();
    return todas.filter(d => d.turmaIds?.includes(turmaId));
  }

  /**
   * Busca disciplina por codigo.
   */
  async getByCodigo(codigo: string): Promise<Disciplina | null> {
    return this.findOneWhere([
      { field: 'codigo', operator: '==', value: codigo },
    ]);
  }
}

// Singleton
export const disciplinaRepository = new DisciplinaRepositoryClass();
