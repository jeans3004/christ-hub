/**
 * Tipos compartilhados para hooks do Firestore.
 */

// Interface for notas by aluno
export interface AlunoNotas {
  alunoId: string;
  av1: number | null;
  rp1: number | null;
  av2: number | null;
  rp2: number | null;
}
