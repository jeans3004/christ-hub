/**
 * Store Zustand para estado do Google Classroom.
 * Suporta selecao de multiplas turmas.
 */

'use client';

import { create } from 'zustand';
import type {
  ClassroomCourse,
  ClassroomCourseWork,
  ClassroomAnnouncement,
  ClassroomStudent,
  ClassroomStudentSubmission,
  ClassroomTopic,
  ClassroomStoreState,
} from '@/types/classroom';

export const useClassroomStore = create<ClassroomStoreState>((set) => ({
  // Estado inicial
  courses: [],
  selectedCourseIds: [],
  courseWork: [],
  announcements: [],
  students: [],
  submissions: new Map(),
  topics: [],
  isLoading: false,
  isLoadingDetails: false,
  error: null,
  lastSync: null,

  // Actions
  setCourses: (courses) => set({ courses }),

  setSelectedCourses: (courseIds) =>
    set({
      selectedCourseIds: courseIds,
      // Limpa dados anteriores ao trocar de turma
      courseWork: [],
      announcements: [],
      students: [],
      submissions: new Map(),
      topics: [],
    }),

  addSelectedCourse: (courseId) =>
    set((state) => ({
      selectedCourseIds: state.selectedCourseIds.includes(courseId)
        ? state.selectedCourseIds
        : [...state.selectedCourseIds, courseId],
    })),

  removeSelectedCourse: (courseId) =>
    set((state) => ({
      selectedCourseIds: state.selectedCourseIds.filter((id) => id !== courseId),
    })),

  toggleSelectedCourse: (courseId) =>
    set((state) => ({
      selectedCourseIds: state.selectedCourseIds.includes(courseId)
        ? state.selectedCourseIds.filter((id) => id !== courseId)
        : [...state.selectedCourseIds, courseId],
    })),

  setCourseWork: (courseWork) => set({ courseWork }),

  setAnnouncements: (announcements) => set({ announcements }),

  setStudents: (students) => set({ students }),

  setSubmissions: (courseWorkId, submissions) =>
    set((state) => {
      const newMap = new Map(state.submissions);
      newMap.set(courseWorkId, submissions);
      return { submissions: newMap };
    }),

  setTopics: (topics) => set({ topics }),

  setLoading: (isLoading) => set({ isLoading }),

  setLoadingDetails: (isLoadingDetails) => set({ isLoadingDetails }),

  setError: (error) => set({ error }),

  setLastSync: (lastSync) => set({ lastSync }),

  reset: () =>
    set({
      courses: [],
      selectedCourseIds: [],
      courseWork: [],
      announcements: [],
      students: [],
      submissions: new Map(),
      topics: [],
      isLoading: false,
      isLoadingDetails: false,
      error: null,
      lastSync: null,
    }),
}));
