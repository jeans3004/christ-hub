/**
 * Hooks customizados do sistema.
 * Centraliza exports para facilitar imports.
 */

export { useAuth } from './useAuth';
export { usePermissions } from './usePermissions';
export { useModal, useConfirmModal } from './useModal';
export { useCRUD, useCRUDWithSoftDelete } from './useCRUD';
export type { CRUDService, UseCRUDOptions, UseCRUDReturn } from './useCRUD';
export { useResponsive, useBreakpoints } from './useResponsive';
export { useOffline } from './useOffline';

// Re-export hooks de dados
export {
  useTurmas,
  useDisciplinas,
  useAlunosByTurma,
  useChamada,
  useNotas,
} from './useFirestoreData';
