/**
 * Repositorio base para operacoes CRUD no Firestore.
 * Abstrai a complexidade do Firestore e fornece tipagem forte.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  Timestamp,
  DocumentData,
  WhereFilterOp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Interface base que todas as entidades devem implementar.
 */
export interface BaseDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tipo para dados de criacao (sem id e timestamps).
 */
export type CreateData<T extends BaseDocument> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Tipo para dados de atualizacao (parcial, sem id e timestamps).
 */
export type UpdateData<T extends BaseDocument> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Opcoes de query.
 */
export interface QueryOptions {
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
}

/**
 * Filtro de query.
 */
export interface QueryFilter {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
}

/**
 * Classe base abstrata para repositorios.
 * Cada entidade deve ter seu proprio repositorio que estende esta classe.
 *
 * @example
 * class AlunoRepository extends BaseRepository<Aluno> {
 *   protected collectionName = 'alunos';
 *
 *   protected fromFirestore(data: DocumentData, id: string): Aluno {
 *     return {
 *       id,
 *       nome: data.nome,
 *       turmaId: data.turmaId,
 *       ativo: data.ativo ?? true,
 *       createdAt: this.convertTimestamp(data.createdAt),
 *       updatedAt: this.convertTimestamp(data.updatedAt),
 *     };
 *   }
 * }
 */
export abstract class BaseRepository<T extends BaseDocument> {
  /**
   * Nome da collection no Firestore.
   */
  protected abstract collectionName: string;

  /**
   * Referencia para a collection.
   */
  protected get collectionRef() {
    return collection(db, this.collectionName);
  }

  /**
   * Cria referencia para um documento.
   */
  protected docRef(id: string) {
    return doc(db, this.collectionName, id);
  }

  /**
   * Converte Timestamp do Firestore para Date.
   */
  protected convertTimestamp(timestamp: unknown): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    return new Date();
  }

  /**
   * Converte dados do Firestore para a entidade tipada.
   * Deve ser implementado por cada repositorio.
   */
  protected abstract fromFirestore(data: DocumentData, id: string): T;

  /**
   * Prepara dados para envio ao Firestore.
   * Pode ser sobrescrito para transformacoes especificas.
   */
  protected toFirestore(data: CreateData<T> | UpdateData<T>): DocumentData {
    return data as DocumentData;
  }

  /**
   * Busca um documento por ID.
   *
   * @param id - ID do documento
   * @returns Documento ou null se nao encontrado
   */
  async getById(id: string): Promise<T | null> {
    const docSnap = await getDoc(this.docRef(id));
    if (!docSnap.exists()) return null;
    return this.fromFirestore(docSnap.data(), docSnap.id);
  }

  /**
   * Busca todos os documentos da collection.
   *
   * @param options - Opcoes de ordenacao e limite
   * @returns Array de documentos
   */
  async getAll(options?: QueryOptions): Promise<T[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
    }

    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.fromFirestore(doc.data(), doc.id));
  }

  /**
   * Busca documentos com filtros.
   *
   * @param filters - Array de filtros
   * @param options - Opcoes de ordenacao e limite
   * @returns Array de documentos filtrados
   */
  async findWhere(filters: QueryFilter[], options?: QueryOptions): Promise<T[]> {
    const constraints: QueryConstraint[] = filters.map(f =>
      where(f.field, f.operator, f.value)
    );

    if (options?.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
    }

    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.fromFirestore(doc.data(), doc.id));
  }

  /**
   * Busca um unico documento com filtros.
   *
   * @param filters - Array de filtros
   * @returns Primeiro documento encontrado ou null
   */
  async findOneWhere(filters: QueryFilter[]): Promise<T | null> {
    const results = await this.findWhere(filters, { limitCount: 1 });
    return results[0] || null;
  }

  /**
   * Cria um novo documento.
   *
   * @param data - Dados do documento (sem id e timestamps)
   * @returns ID do documento criado
   */
  async create(data: CreateData<T>): Promise<string> {
    const docData = {
      ...this.toFirestore(data),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(this.collectionRef, docData);
    return docRef.id;
  }

  /**
   * Atualiza um documento existente.
   *
   * @param id - ID do documento
   * @param data - Dados a atualizar
   */
  async update(id: string, data: UpdateData<T>): Promise<void> {
    const docData = {
      ...this.toFirestore(data),
      updatedAt: Timestamp.now(),
    };
    await updateDoc(this.docRef(id), docData);
  }

  /**
   * Remove um documento permanentemente.
   *
   * @param id - ID do documento
   */
  async delete(id: string): Promise<void> {
    await deleteDoc(this.docRef(id));
  }

  /**
   * Desativa um documento (soft delete).
   * Requer que a entidade tenha campo 'ativo'.
   *
   * @param id - ID do documento
   */
  async softDelete(id: string): Promise<void> {
    await this.update(id, { ativo: false } as unknown as UpdateData<T>);
  }

  /**
   * Reativa um documento.
   *
   * @param id - ID do documento
   */
  async restore(id: string): Promise<void> {
    await this.update(id, { ativo: true } as unknown as UpdateData<T>);
  }

  /**
   * Verifica se um documento existe.
   *
   * @param id - ID do documento
   * @returns true se existe
   */
  async exists(id: string): Promise<boolean> {
    const docSnap = await getDoc(this.docRef(id));
    return docSnap.exists();
  }

  /**
   * Conta documentos com filtros opcionais.
   *
   * @param filters - Filtros opcionais
   * @returns Contagem de documentos
   */
  async count(filters?: QueryFilter[]): Promise<number> {
    const docs = filters ? await this.findWhere(filters) : await this.getAll();
    return docs.length;
  }
}
