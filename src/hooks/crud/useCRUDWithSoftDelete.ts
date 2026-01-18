/**
 * Hook para CRUD com soft delete.
 */

import { useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { UseCRUDOptions, UseCRUDReturn } from './crudTypes';
import { useCRUD } from './useCRUDBase';

/**
 * Hook para soft delete (desativar em vez de deletar).
 * Util para entidades que tem campo 'ativo'.
 */
export function useCRUDWithSoftDelete<T extends { id: string; ativo?: boolean }>({
  service,
  entityName,
  onSuccess,
  autoLoad = true,
  filter,
  showInactive = false,
}: UseCRUDOptions<T> & { showInactive?: boolean }): UseCRUDReturn<T> & {
  softDeleteItem: (id: string) => Promise<boolean>;
  restoreItem: (id: string) => Promise<boolean>;
} {
  const baseHook = useCRUD({
    service,
    entityName,
    onSuccess,
    autoLoad,
    filter: showInactive ? filter : (items) => {
      const activeItems = items.filter(item => item.ativo !== false);
      return filter ? filter(activeItems) : activeItems;
    },
  });

  const { addToast } = useUIStore();

  const softDeleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      await service.update(id, { ativo: false } as Partial<T>);
      addToast(`${entityName} desativado com sucesso!`, 'success');
      onSuccess?.();
      await baseHook.loadItems();
      return true;
    } catch {
      addToast(`Erro ao desativar ${entityName.toLowerCase()}`, 'error');
      return false;
    }
  }, [service, entityName, addToast, onSuccess, baseHook]);

  const restoreItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      await service.update(id, { ativo: true } as Partial<T>);
      addToast(`${entityName} reativado com sucesso!`, 'success');
      onSuccess?.();
      await baseHook.loadItems();
      return true;
    } catch {
      addToast(`Erro ao reativar ${entityName.toLowerCase()}`, 'error');
      return false;
    }
  }, [service, entityName, addToast, onSuccess, baseHook]);

  return {
    ...baseHook,
    softDeleteItem,
    restoreItem,
  };
}
