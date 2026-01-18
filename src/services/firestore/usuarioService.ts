/**
 * Servico de usuarios.
 */

import { Usuario, UserRole } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where, limit, orderBy } from './base';

const COLLECTION = 'usuarios';

export const usuarioService = {
  get: (id: string) => getDocument<Usuario>(COLLECTION, id),
  getAll: () => getDocuments<Usuario>(COLLECTION),

  getByEmail: async (email: string): Promise<Usuario | null> => {
    const docs = await getDocuments<Usuario>(COLLECTION, [where('email', '==', email), limit(1)]);
    return docs[0] || null;
  },

  /**
   * Busca usuario por googleEmail (para linking de UID).
   */
  getByGoogleEmail: async (googleEmail: string): Promise<Usuario | null> => {
    const docs = await getDocuments<Usuario>(COLLECTION, [where('googleEmail', '==', googleEmail), limit(1)]);
    return docs[0] || null;
  },

  /**
   * Verifica se e-mail ja esta cadastrado.
   */
  checkEmailExists: async (email: string, excludeId?: string): Promise<boolean> => {
    const docs = await getDocuments<Usuario>(COLLECTION, [where('googleEmail', '==', email), limit(1)]);
    if (docs.length === 0) return false;
    if (excludeId && docs[0].id === excludeId) return false;
    return true;
  },

  /**
   * Lista professores (professor e coordenador) ordenados por nome.
   */
  getProfessores: async (): Promise<Usuario[]> => {
    const all = await getDocuments<Usuario>(COLLECTION);
    return all
      .filter(u => u.tipo === 'professor' || u.tipo === 'coordenador')
      .sort((a, b) => a.nome.localeCompare(b.nome));
  },

  /**
   * Lista professores ativos.
   */
  getProfessoresAtivos: async (): Promise<Usuario[]> => {
    const professores = await usuarioService.getProfessores();
    return professores.filter(p => p.ativo);
  },

  /**
   * Vincula UID do Google Auth ao usuario pre-cadastrado.
   */
  linkUidToEmail: async (googleEmail: string, uid: string): Promise<boolean> => {
    const usuario = await usuarioService.getByGoogleEmail(googleEmail);
    if (!usuario) return false;
    if (usuario.authStatus === 'linked') return false; // Ja vinculado

    await updateDocument(COLLECTION, usuario.id, {
      googleUid: uid,
      authStatus: 'linked',
      firstLoginAt: new Date(),
    });
    return true;
  },

  create: (data: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<Usuario>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),
};
