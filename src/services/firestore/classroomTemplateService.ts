/**
 * Servico para templates do Google Classroom.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ClassroomTemplate, ClassroomPostType } from '@/types/classroom';

const COLLECTION = 'classroomTemplates';

// Converter Firestore -> ClassroomTemplate
const converter = {
  toFirestore: (template: Partial<ClassroomTemplate>) => {
    const data: Record<string, unknown> = { ...template };
    if (template.createdAt) data.createdAt = Timestamp.fromDate(template.createdAt);
    if (template.updatedAt) data.updatedAt = Timestamp.fromDate(template.updatedAt);
    return data;
  },
  fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot): ClassroomTemplate => {
    const data = snap.data();
    return {
      id: snap.id,
      nome: data.nome,
      tipo: data.tipo,
      texto: data.texto,
      anexos: data.anexos,
      pontuacao: data.pontuacao,
      prazoEmDias: data.prazoEmDias,
      criadoPorId: data.criadoPorId,
      criadoPorNome: data.criadoPorNome,
      usageCount: data.usageCount || 0,
      ativo: data.ativo ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  },
};

export const classroomTemplateService = {
  /**
   * Lista todos os templates ativos
   */
  async getAll(): Promise<ClassroomTemplate[]> {
    const q = query(
      collection(db, COLLECTION),
      where('ativo', '==', true),
      orderBy('usageCount', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => converter.fromFirestore(d as unknown as FirebaseFirestore.QueryDocumentSnapshot));
  },

  /**
   * Lista templates por tipo
   */
  async getByTipo(tipo: ClassroomPostType): Promise<ClassroomTemplate[]> {
    const q = query(
      collection(db, COLLECTION),
      where('ativo', '==', true),
      where('tipo', '==', tipo),
      orderBy('usageCount', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => converter.fromFirestore(d as unknown as FirebaseFirestore.QueryDocumentSnapshot));
  },

  /**
   * Obtem um template pelo ID
   */
  async get(id: string): Promise<ClassroomTemplate | null> {
    const docRef = doc(db, COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return converter.fromFirestore(snap as unknown as FirebaseFirestore.QueryDocumentSnapshot);
  },

  /**
   * Cria um novo template
   */
  async create(data: Omit<ClassroomTemplate, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      usageCount: 0,
      ativo: true,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });
    return docRef.id;
  },

  /**
   * Atualiza um template
   */
  async update(id: string, data: Partial<ClassroomTemplate>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  /**
   * Incrementa o contador de uso
   */
  async incrementUsage(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      usageCount: increment(1),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  /**
   * Desativa um template (soft delete)
   */
  async deactivate(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ativo: false,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  /**
   * Deleta um template permanentemente
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },
};
