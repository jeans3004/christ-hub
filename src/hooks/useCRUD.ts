import { useState, useCallback, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

/**
 * Interface generica para servicos CRUD.
 * Qualquer servico que implemente esses metodos pode ser usado com useCRUD.
 */
export interface CRUDService<T> {
  getAll: () => Promise<T[]>;
  create: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  update: (id: string, data: Partial<T>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

/**
 * Opcoes de configuracao do hook useCRUD.
 */
export interface UseCRUDOptions<T> {
  /** Servico que implementa as operacoes CRUD */
  service: CRUDService<T>;
  /** Nome da entidade para mensagens (ex: 'Aluno', 'Professor') */
  entityName: string;
  /** Callback executado apos operacao bem sucedida */
  onSuccess?: () => void;
  /** Se true, carrega dados automaticamente ao montar */
  autoLoad?: boolean;
  /** Funcao para filtrar itens apos carregamento */
  filter?: (items: T[]) => T[];
}

/**
 * Retorno do hook useCRUD.
 */
export interface UseCRUDReturn<T> {
  /** Lista de itens */
  items: T[];
  /** Se esta carregando dados */
  loading: boolean;
  /** Se esta salvando dados */
  saving: boolean;
  /** Erro ocorrido na ultima operacao */
  error: Error | null;
  /** Carrega/recarrega a lista de itens */
  loadItems: () => Promise<void>;
  /** Cria um novo item */
  createItem: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  /** Atualiza um item existente */
  updateItem: (id: string, data: Partial<T>) => Promise<boolean>;
  /** Remove um item */
  deleteItem: (id: string) => Promise<boolean>;
  /** Alias para loadItems */
  refresh: () => Promise<void>;
  /** Limpa o erro */
  clearError: () => void;
}

/**
 * Hook generico para operacoes CRUD.
 * Gerencia estado de loading, saving, erro e lista de itens.
 *
 * @example
 * const {
 *   items: alunos,
 *   loading,
 *   saving,
 *   createItem,
 *   updateItem,
 *   deleteItem,
 * } = useCRUD({
 *   service: alunoService,
 *   entityName: 'Aluno',
 *   autoLoad: true,
 * });
 *
 * // Criar
 * await createItem({ nome: 'Joao', turmaId: '123' });
 *
 * // Atualizar
 * await updateItem('abc', { nome: 'Joao Silva' });
 *
 * // Deletar
 * await deleteItem('abc');
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

  // Auto load on mount
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
    } catch (err) {
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
    } catch (err) {
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
