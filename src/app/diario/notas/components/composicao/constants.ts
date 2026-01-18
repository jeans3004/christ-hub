/**
 * Constantes especificas para composicao de notas.
 */

import { NivelRubrica } from '@/types';

/**
 * Porcentagens para cada nivel de rubrica.
 */
export const NIVEL_PERCENTUAL: Record<NivelRubrica, number> = {
  A: 100,
  B: 80,
  C: 60,
  D: 40,
  E: 20,
};
