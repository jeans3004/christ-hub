import { DocumentData } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import { Professor } from '@/types';

/**
 * Repositorio para operacoes com Professores.
 */
class ProfessorRepositoryClass extends BaseRepository<Professor> {
  protected collectionName = 'professores';

  protected fromFirestore(data: DocumentData, id: string): Professor {
    return {
      id,
      nome: data.nome || '',
      cpf: data.cpf || '',
      telefone: data.telefone,
      email: data.email,
      coordenador: data.coordenador ?? false,
      disciplinas: data.disciplinas || [],
      turmas: data.turmas || [],
      ativo: data.ativo ?? true,
      createdAt: this.convertTimestamp(data.createdAt),
      updatedAt: this.convertTimestamp(data.updatedAt),
    };
  }

  /**
   * Busca professores ativos.
   */
  async getAtivos(): Promise<Professor[]> {
    return this.findWhere([
      { field: 'ativo', operator: '==', value: true },
    ], { orderByField: 'nome' });
  }

  /**
   * Busca professor por CPF.
   */
  async getByCpf(cpf: string): Promise<Professor | null> {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return this.findOneWhere([
      { field: 'cpf', operator: '==', value: cpfLimpo },
    ]);
  }

  /**
   * Busca professor por email.
   */
  async getByEmail(email: string): Promise<Professor | null> {
    return this.findOneWhere([
      { field: 'email', operator: '==', value: email.toLowerCase() },
    ]);
  }

  /**
   * Busca coordenadores.
   */
  async getCoordenadores(): Promise<Professor[]> {
    return this.findWhere([
      { field: 'coordenador', operator: '==', value: true },
      { field: 'ativo', operator: '==', value: true },
    ], { orderByField: 'nome' });
  }

  /**
   * Busca professores de uma disciplina.
   */
  async getByDisciplina(disciplinaId: string): Promise<Professor[]> {
    const todos = await this.getAtivos();
    return todos.filter(p => p.disciplinas?.includes(disciplinaId));
  }

  /**
   * Busca professores de uma turma.
   */
  async getByTurma(turmaId: string): Promise<Professor[]> {
    const todos = await this.getAtivos();
    return todos.filter(p => p.turmas?.includes(turmaId));
  }
}

// Singleton
export const professorRepository = new ProfessorRepositoryClass();
