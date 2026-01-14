import { DocumentData } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import { Turma } from '@/types';

/**
 * Repositorio para operacoes com Turmas.
 */
class TurmaRepositoryClass extends BaseRepository<Turma> {
  protected collectionName = 'turmas';

  protected fromFirestore(data: DocumentData, id: string): Turma {
    return {
      id,
      nome: data.nome || '',
      serie: data.serie || '',
      turno: data.turno || 'Matutino',
      ano: data.ano || new Date().getFullYear(),
      ativo: data.ativo ?? true,
      createdAt: this.convertTimestamp(data.createdAt),
      updatedAt: this.convertTimestamp(data.updatedAt),
    };
  }

  /**
   * Busca turmas por ano letivo.
   */
  async getByAno(ano: number): Promise<Turma[]> {
    return this.findWhere([
      { field: 'ano', operator: '==', value: ano },
    ], { orderByField: 'nome' });
  }

  /**
   * Busca turmas ativas por ano.
   */
  async getAtivasByAno(ano: number): Promise<Turma[]> {
    return this.findWhere([
      { field: 'ano', operator: '==', value: ano },
      { field: 'ativo', operator: '==', value: true },
    ], { orderByField: 'nome' });
  }

  /**
   * Busca apenas turmas ativas.
   */
  async getAtivas(): Promise<Turma[]> {
    return this.findWhere([
      { field: 'ativo', operator: '==', value: true },
    ], { orderByField: 'nome' });
  }

  /**
   * Busca turmas por serie.
   */
  async getBySerie(serie: string): Promise<Turma[]> {
    return this.findWhere([
      { field: 'serie', operator: '==', value: serie },
      { field: 'ativo', operator: '==', value: true },
    ], { orderByField: 'nome' });
  }

  /**
   * Busca turmas por turno.
   */
  async getByTurno(turno: string): Promise<Turma[]> {
    return this.findWhere([
      { field: 'turno', operator: '==', value: turno },
      { field: 'ativo', operator: '==', value: true },
    ], { orderByField: 'nome' });
  }
}

// Singleton
export const turmaRepository = new TurmaRepositoryClass();
