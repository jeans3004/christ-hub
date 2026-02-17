/**
 * Exports de todos os servicos do Firestore.
 */

export { usuarioService } from './usuarioService';
export { professorService } from './professorService';
export { alunoService } from './alunoService';
export { turmaService } from './turmaService';
export { disciplinaService } from './disciplinaService';
export { chamadaService } from './chamadaService';
export { notaService } from './notaService';
export { conceitoService } from './conceitoService';
export { rubricaService } from './rubricaService';
export { avaliacaoRubricaService } from './avaliacaoRubricaService';
export { ocorrenciaService } from './ocorrenciaService';
export { templateComposicaoService } from './templateComposicaoService';
export { mapeamentoSalaService } from './mapeamentoSalaService';
export { mensagemLogService } from './mensagemLogService';
export { templateMensagemService, extractVariables, replaceVariables } from './templateMensagemService';
export { eventoService } from './eventoService';
export { relatorioService } from './relatorioService';
export { horarioService } from './horarioService';
export { chamadaTrilhaService } from './chamadaTrilhaService';
export type { ChamadaTrilhaInput } from './chamadaTrilhaService';
export { classroomTemplateService } from './classroomTemplateService';
export { classroomSectionService } from './classroomSectionService';
export { grupoWhatsappService } from './grupoWhatsappService';
export { sorteioService } from './sorteioService';
export type { Sorteio } from './sorteioService';
export { atrasoService } from './atrasoService';
export { atestadoService } from './atestadoService';
export { eAlunoConfigService } from './eAlunoConfigService';
export { conteudoAulaService } from './conteudoService';

// Re-export base utilities for advanced usage
export { getDocument, getDocuments, createDocument, updateDocument, deleteDocument } from './base';
export { where, orderBy, limit, Timestamp } from './base';
export type { QueryConstraint } from './base';
