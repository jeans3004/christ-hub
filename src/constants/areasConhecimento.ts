/**
 * Constantes das Areas do Conhecimento (BNCC - Novo Ensino Medio).
 */

export const AREAS_CONHECIMENTO = [
  { id: 'linguagens', nome: 'Linguagens e suas Tecnologias', cor: '#4CAF50', sigla: 'LIN' },
  { id: 'matematica', nome: 'Matemática e suas Tecnologias', cor: '#2196F3', sigla: 'MAT' },
  { id: 'ciencias_natureza', nome: 'Ciências da Natureza e suas Tecnologias', cor: '#FF9800', sigla: 'CNT' },
  { id: 'ciencias_humanas', nome: 'Ciências Humanas e Sociais Aplicadas', cor: '#9C27B0', sigla: 'CHS' },
  { id: 'formacao_tecnica', nome: 'Formação Técnica e Profissional', cor: '#795548', sigla: 'FTP' },
] as const;

export const SERIES_ENSINO_MEDIO = ['1ª Série', '2ª Série', '3ª Série'] as const;

export type AreaConhecimentoId = typeof AREAS_CONHECIMENTO[number]['id'];
export type SerieEnsinoMedio = typeof SERIES_ENSINO_MEDIO[number];

// Helpers
export function getAreaById(id: AreaConhecimentoId) {
  return AREAS_CONHECIMENTO.find(a => a.id === id);
}

export function getAreaColor(id: AreaConhecimentoId): string {
  return getAreaById(id)?.cor || '#9E9E9E';
}

export function getAreaSigla(id: AreaConhecimentoId): string {
  return getAreaById(id)?.sigla || '';
}

export function getAreaNome(id: AreaConhecimentoId): string {
  return getAreaById(id)?.nome || '';
}
