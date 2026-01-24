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
  ClassroomTeacher,
  ClassroomStudentSubmission,
  ClassroomTopic,
  ClassroomInvitationWithProfile,
} from '@/types/classroom';

interface ClassroomStoreState {
  // Dados
  courses: ClassroomCourse[];
  selectedCourseIds: string[];
  courseWork: ClassroomCourseWork[];
  announcements: ClassroomAnnouncement[];
  students: ClassroomStudent[];
  teachers: ClassroomTeacher[];
  invitations: ClassroomInvitationWithProfile[];
  submissions: Map<string, ClassroomStudentSubmission[]>;
  topics: ClassroomTopic[];

  // UI State
  isLoading: boolean;
  isLoadingDetails: boolean;
  error: string | null;
  lastSync: Date | null;

  // Actions
  setCourses: (courses: ClassroomCourse[]) => void;
  setSelectedCourses: (courseIds: string[]) => void;
  addSelectedCourse: (courseId: string) => void;
  removeSelectedCourse: (courseId: string) => void;
  toggleSelectedCourse: (courseId: string) => void;
  setCourseWork: (courseWork: ClassroomCourseWork[]) => void;
  setAnnouncements: (announcements: ClassroomAnnouncement[]) => void;
  setStudents: (students: ClassroomStudent[]) => void;
  setTeachers: (teachers: ClassroomTeacher[]) => void;
  setInvitations: (invitations: ClassroomInvitationWithProfile[]) => void;
  setSubmissions: (courseWorkId: string, submissions: ClassroomStudentSubmission[]) => void;
  setTopics: (topics: ClassroomTopic[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadingDetails: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastSync: (date: Date) => void;
  reset: () => void;
}

export const useClassroomStore = create<ClassroomStoreState>((set) => ({
  // Estado inicial
  courses: [],
  selectedCourseIds: [],
  courseWork: [],
  announcements: [],
  students: [],
  teachers: [],
  invitations: [],
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
      teachers: [],
      invitations: [],
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

  setTeachers: (teachers) => set({ teachers }),

  setInvitations: (invitations) => set({ invitations }),

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
      teachers: [],
      invitations: [],
      submissions: new Map(),
      topics: [],
      isLoading: false,
      isLoadingDetails: false,
      error: null,
      lastSync: null,
    }),
}));
