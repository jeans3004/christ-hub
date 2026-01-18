/**
 * Hook base para operacoes CRUD genericas.
 */

import { useState, useCallback, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { UseCRUDOptions, UseCRUDReturn } from './crudTypes';

/**
 * Hook generico para operacoes CRUD.
 * Gerencia estado de loading, saving, erro e lista de itens.
 */
export function useCRUD<T extends { id: string }>({
  service,
  entityName,
  onSuccess,
  autoLoad = true,
  filter,
}: UseCRUDOptions<T>): UseCRUDReturn<T> {
  const { addToast } = useUIStore();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await service.getAll();
      if (filter) {
        data = filter(data);
      }
      setItems(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      addToast(`Erro ao carregar ${entityName.toLowerCase()}s`, 'error');
    } finally {
      setLoading(false);
    }
  }, [service, entityName, filter, addToast]);

  const createItem = useCallback(async (
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string | null> => {
    setSaving(true);
    setError(null);
    try {
      const id = await service.create(data);
      addToast(`${entityName} criado com sucesso!`, 'success');
      onSuccess?.();
      await loadItems();
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao criar');
      setError(error);
      addToast(`Erro ao criar ${entityName.toLowerCase()}`, 'error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [service, entityName, addToast, onSuccess, loadItems]);

  const updateItem = useCallback(async (
    id: string,
    data: Partial<T>
  ): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await service.update(id, data);
      addToast(`${entityName} atualizado com sucesso!`, 'success');
      onSuccess?.();
      await loadItems();
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao atualizar');
      setError(error);
      addToast(`Erro ao atualizar ${entityName.toLowerCase()}`, 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [service, entityName, addToast, onSuccess, loadItems]);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await service.delete(id);
      addToast(`${entityName} removido com sucesso!`, 'success');
      onSuccess?.();
      await loadItems();
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao remover');
      setError(error);
      addToast(`Erro ao remover ${entityName.toLowerCase()}`, 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [service, entityName, addToast, onSuccess, loadItems]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadItems();
    }
  }, [autoLoad, loadItems]);

  return {
    items,
    loading,
    saving,
    error,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    refresh: loadItems,
    clearError,
  };
}
