// src/lib/sge/index.ts
export { getSession, invalidateSession, encryptPassword, decryptPassword } from './session';
export { sgeFetch, sgeFetchJSON, toEAlunoDate } from './client';
export type { SgeCredentials } from './client';
export { chamadaClient } from './chamadaClient';
export type { SgeSerieOption, SgeStudent, SgeChamadaDetail } from './chamadaClient';
export { conteudoClient } from './conteudoClient';
export type { SgeConteudo } from './conteudoClient';
export { ocorrenciaClient } from './ocorrenciaClient';
export type { SgeOcorrencia } from './ocorrenciaClient';
export { relatorioClient } from './relatorioClient';
export type { SgeRelatorioParams } from './relatorioClient';
