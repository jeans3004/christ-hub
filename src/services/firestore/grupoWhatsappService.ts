/**
 * Servico Firestore para grupos do WhatsApp.
 * Permite sincronizar e persistir grupos localmente.
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  Timestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import type { GrupoWhatsApp } from '@/types';

// Interface para grupo da Evolution API
interface EvolutionGroup {
  id: string;
  subject?: string;
  name?: string;
  size?: number;
  participants?: unknown[];
  owner?: string;
}

// Interface para grupo salvo no Firestore
export interface GrupoWhatsAppFirestore {
  id: string;
  nome: string;
  tamanho: number;
  owner?: string;
  sincronizadoEm: Timestamp;
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const COLLECTION = 'gruposWhatsapp';

export const grupoWhatsappService = {
  /**
   * Sincroniza grupos do WhatsApp para o Firestore.
   * Usa batch write para melhor performance.
   */
  async syncFromEvolution(grupos: EvolutionGroup[]): Promise<number> {
    if (!grupos.length) return 0;

    const batch = writeBatch(db);
    const now = Timestamp.now();
    let count = 0;

    for (const grupo of grupos) {
      // Usa o ID do grupo como document ID (sanitizado para Firestore)
      const docId = grupo.id.replace(/[/@]/g, '_');
      const docRef = doc(db, COLLECTION, docId);

      batch.set(
        docRef,
        {
          id: grupo.id,
          nome: grupo.subject || grupo.name || 'Grupo sem nome',
          tamanho: grupo.size || (grupo.participants as unknown[])?.length || 0,
          owner: grupo.owner || null,
          sincronizadoEm: now,
          ativo: true,
          updatedAt: now,
        },
        { merge: true }
      );

      count++;
    }

    await batch.commit();
    return count;
  },

  /**
   * Lista todos os grupos ativos.
   */
  async getAll(): Promise<GrupoWhatsApp[]> {
    const q = query(
      collection(db, COLLECTION),
      where('ativo', '==', true),
      orderBy('nome', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.data().id,
          nome: doc.data().nome,
          participantes: doc.data().tamanho,
          isAdmin: false,
        } as GrupoWhatsApp)
    );
  },

  /**
   * Busca grupo por ID (groupJid).
   */
  async getById(groupJid: string): Promise<GrupoWhatsAppFirestore | null> {
    const docId = groupJid.replace(/[/@]/g, '_');
    const docRef = doc(db, COLLECTION, docId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    return {
      ...snapshot.data(),
      id: snapshot.data().id,
    } as GrupoWhatsAppFirestore;
  },

  /**
   * Desativa um grupo (soft delete).
   */
  async deactivate(groupJid: string): Promise<void> {
    const docId = groupJid.replace(/[/@]/g, '_');
    const docRef = doc(db, COLLECTION, docId);
    await setDoc(
      docRef,
      {
        ativo: false,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  },

  /**
   * Atualiza informacoes de um grupo.
   */
  async update(groupJid: string, data: Partial<GrupoWhatsAppFirestore>): Promise<void> {
    const docId = groupJid.replace(/[/@]/g, '_');
    const docRef = doc(db, COLLECTION, docId);
    await setDoc(
      docRef,
      {
        ...data,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  },
};
