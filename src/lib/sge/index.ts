// src/lib/sge/index.ts
export { getSession, invalidateSession, encryptPassword, decryptPassword } from './session';
export { sgeFetch, sgeFetchJSON, toEAlunoDate } from './client';
export type { SgeCredentials } from './client';
// Uncomment as sub-clients are built:
// export { chamadaClient } from './chamadaClient';
// export { conteudoClient } from './conteudoClient';
// export { ocorrenciaClient } from './ocorrenciaClient';
// export { relatorioClient } from './relatorioClient';
