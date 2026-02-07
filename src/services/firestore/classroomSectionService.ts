/**
 * Servico para gerenciar secoes (areas) de cursos do Google Classroom.
 * Persiste a configuracao de secoes por curso no Firestore.
 */

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CourseSectionsConfig, CourseSection } from '@/types/classroom';

const COLLECTION = 'classroomCourseSections';

export const classroomSectionService = {
  /**
   * Busca as secoes configuradas para um curso.
   */
  async getCourseSections(courseId: string): Promise<CourseSectionsConfig | null> {
    const docRef = doc(db, COLLECTION, courseId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      courseId: data.courseId,
      sections: data.sections || [],
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  },

  /**
   * Salva/atualiza as secoes de um curso.
   */
  async saveCourseSections(courseId: string, sections: CourseSection[]): Promise<void> {
    const docRef = doc(db, COLLECTION, courseId);
    await setDoc(docRef, {
      courseId,
      sections,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  /**
   * Remove a configuracao de secoes de um curso.
   */
  async deleteCourseSections(courseId: string): Promise<void> {
    const docRef = doc(db, COLLECTION, courseId);
    await deleteDoc(docRef);
  },
};
