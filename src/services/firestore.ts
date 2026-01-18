/**
 * Re-exports de todos os servicos do Firestore.
 * Este arquivo mantem compatibilidade com imports existentes.
 */

export {
  usuarioService,
  professorService,
  alunoService,
  turmaService,
  disciplinaService,
  chamadaService,
  notaService,
  conceitoService,
  rubricaService,
  avaliacaoRubricaService,
  ocorrenciaService,
  templateComposicaoService,
  mapeamentoSalaService,
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
  limit,
  Timestamp,
} from './firestore/index';

export type { QueryConstraint } from './firestore/index';
