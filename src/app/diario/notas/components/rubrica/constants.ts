/**
 * Constantes para avaliacao por rubricas.
 */

import { NivelRubrica } from '@/types';

/**
 * Cores para cada nivel de rubrica.
 */
export const NIVEL_COLORS: Record<NivelRubrica, { bg: string; text: string; border: string }> = {
  A: { bg: 'rgba(76, 175, 80, 0.15)', text: '#2E7D32', border: '#4CAF50' },
  B: { bg: 'rgba(33, 150, 243, 0.15)', text: '#1565C0', border: '#2196F3' },
  C: { bg: 'rgba(255, 193, 7, 0.15)', text: '#F57F17', border: '#FFC107' },
  D: { bg: 'rgba(255, 152, 0, 0.15)', text: '#E65100', border: '#FF9800' },
  E: { bg: 'rgba(244, 67, 54, 0.15)', text: '#C62828', border: '#F44336' },
};

/**
 * Niveis disponiveis para avaliacao.
 */
export const NIVEIS: NivelRubrica[] = ['A', 'B', 'C', 'D', 'E'];
