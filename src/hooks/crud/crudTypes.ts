/**
 * Tipos para operacoes CRUD genericas.
 */

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
