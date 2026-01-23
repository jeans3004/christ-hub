/**
 * Constantes do sistema.
 * Centraliza exports para facilitar imports.
 */

export { NAVIGATION, ROUTES, DRAWER_WIDTH } from './navigation';
export type { NavItem, NavSection } from './navigation';

export {
  ROLE_PERMISSIONS,
  ADMIN_EMAILS,
  ROLE_DISPLAY_NAMES,
  ROLE_COLORS,
  ROLE_DESCRIPTIONS,
} from './permissions';
export type { Permission } from './permissions';

export {
  AREAS_CONHECIMENTO,
  SERIES_ENSINO_MEDIO,
  getAreaById,
  getAreaColor,
  getAreaSigla,
  getAreaNome,
} from './areasConhecimento';
export type { AreaConhecimentoId, SerieEnsinoMedio } from './areasConhecimento';
