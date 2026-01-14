/**
 * Repositorios do sistema.
 * Camada de abstracao sobre o Firestore.
 */

export { BaseRepository } from './BaseRepository';
export type { BaseDocument, CreateData, UpdateData, QueryOptions, QueryFilter } from './BaseRepository';

export { alunoRepository } from './AlunoRepository';
export { turmaRepository } from './TurmaRepository';
export { disciplinaRepository } from './DisciplinaRepository';
export { professorRepository } from './ProfessorRepository';
