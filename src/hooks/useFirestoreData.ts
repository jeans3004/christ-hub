/**
 * Re-exports de todos os hooks do Firestore.
 * Este arquivo mantem compatibilidade com imports existentes.
 */

export {
  useTurmas,
  useDisciplinas,
  useAlunosByTurma,
  useChamada,
  useNotas,
  useRubricas,
  useAvaliacoesRubricas,
} from './firestore/index';

export type { AlunoNotas } from './firestore/index';
