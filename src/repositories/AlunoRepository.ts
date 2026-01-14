import { DocumentData } from 'firebase/firestore';
import { BaseRepository, CreateData } from './BaseRepository';
import { Aluno } from '@/types';

/**
 * Repositorio para operacoes com Alunos.
 */
class AlunoRepositoryClass extends BaseRepository<Aluno> {
  protected collectionName = 'alunos';

  protected fromFirestore(data: DocumentData, id: string): Aluno {
    return {
      id,
      nome: data.nome || '',
      cpf: data.cpf,
      dataNascimento: data.dataNascimento ? this.convertTimestamp(data.dataNascimento) : undefined,
      turmaId: data.turmaId || '',
      turma: data.turma,
      serie: data.serie,
      turno: data.turno,
      matricula: data.matricula,
      ativo: data.ativo ?? true,
      createdAt: this.convertTimestamp(data.createdAt),
      updatedAt: this.convertTimestamp(data.updatedAt),
    };
  }

  /**
   * Busca alunos por turma.
   */
  async getByTurma(turmaId: string): Promise<Aluno[]> {
    return this.findWhere([
      { field: 'turmaId', operator: '==', value: turmaId },
    ], { orderByField: 'nome' });
  }

  /**
   * Busca alunos ativos por turma.
   */
  async getAtivosByTurma(turmaId: string): Promise<Aluno[]> {
    return this.findWhere([
      { field: 'turmaId', operator: '==', value: turmaId },
      { field: 'ativo', operator: '==', value: true },
    ], { orderByField: 'nome' });
  }

  /**
   * Busca apenas alunos ativos.
   */
  async getAtivos(): Promise<Aluno[]> {
    return this.findWhere([
      { field: 'ativo', operator: '==', value: true },
    ], { orderByField: 'nome' });
  }

  /**
   * Busca aluno por matricula.
   */
  async getByMatricula(matricula: string): Promise<Aluno | null> {
    return this.findOneWhere([
      { field: 'matricula', operator: '==', value: matricula },
    ]);
  }

  /**
   * Busca aniversariantes do mes.
   */
  async getAniversariantes(mes: number): Promise<Aluno[]> {
    const alunos = await this.getAtivos();
    return alunos.filter(aluno => {
      if (!aluno.dataNascimento) return false;
      return aluno.dataNascimento.getMonth() + 1 === mes;
    });
  }
}

// Singleton
export const alunoRepository = new AlunoRepositoryClass();
