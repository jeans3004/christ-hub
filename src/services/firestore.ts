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
  chamadaTrilhaService,
  notaService,
  conceitoService,
  rubricaService,
  avaliacaoRubricaService,
  ocorrenciaService,
  templateComposicaoService,
  mapeamentoSalaService,
  mensagemLogService,
  templateMensagemService,
  eventoService,
  relatorioService,
  horarioService,
  classroomTemplateService,
  extractVariables,
  replaceVariables,
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

export type { QueryConstraint, ChamadaTrilhaInput } from './firestore/index';
