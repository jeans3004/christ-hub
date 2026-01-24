/**
 * Hook de carregamento de dados do Google Classroom.
 * Suporta carregamento de multiplas turmas simultaneamente.
 */

'use client';

import { useCallback } from 'react';
import { useDriveStore } from '@/store/driveStore';
import { useClassroomStore } from './useClassroomStore';
import { createClassroomService } from '@/services/classroomService';
import { useUIStore } from '@/store/uiStore';
import type {
  ClassroomCourseWork,
  ClassroomAnnouncement,
  ClassroomStudent,
  ClassroomTopic,
} from '@/types/classroom';

export function useClassroomLoader() {
  const { accessToken } = useDriveStore();
  const { addToast } = useUIStore();
  const {
    courses,
    selectedCourseIds,
    courseWork,
    announcements,
    students,
    submissions,
    topics,
    isLoading,
    isLoadingDetails,
    error,
    lastSync,
    setCourses,
    setSelectedCourses,
    toggleSelectedCourse,
    setCourseWork,
    setAnnouncements,
    setStudents,
    setSubmissions,
    setTopics,
    setLoading,
    setLoadingDetails,
    setError,
    setLastSync,
  } = useClassroomStore();

  /**
   * Carrega todas as turmas do professor
   */
  const loadCourses = useCallback(async () => {
    if (!accessToken) {
      setError('Token de acesso nao disponivel. Faca login novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const service = createClassroomService(accessToken);
      const { courses: fetchedCourses } = await service.listCourses({
        teacherId: 'me',
        courseStates: ['ACTIVE'],
      });

      // Ordenar por nome
      const sortedCourses = fetchedCourses.sort((a, b) => a.name.localeCompare(b.name));
      setCourses(sortedCourses);
      setLastSync(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar turmas';
      setError(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [accessToken, setCourses, setLoading, setError, setLastSync, addToast]);

  /**
   * Carrega detalhes de uma unica turma (para selecao simples)
   */
  const loadCourseDetails = useCallback(
    async (courseId: string) => {
      if (!accessToken) {
        setError('Token de acesso nao disponivel.');
        return;
      }

      setLoadingDetails(true);
      setError(null);
      setSelectedCourses([courseId]);

      try {
        const service = createClassroomService(accessToken);

        // Carregar dados em paralelo
        const [work, anns, studs, tpcs] = await Promise.all([
          service.listCourseWork(courseId, { courseWorkStates: ['PUBLISHED'] }),
          service.listAnnouncements(courseId, { announcementStates: ['PUBLISHED'] }),
          service.listStudents(courseId),
          service.listTopics(courseId),
        ]);

        // Ordenar atividades por data de criacao (mais recentes primeiro)
        const sortedWork = work.sort(
          (a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
        );

        // Ordenar anuncios por data
        const sortedAnns = anns.sort(
          (a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
        );

        // Ordenar alunos por nome
        const sortedStuds = studs.sort((a, b) =>
          a.profile.name.fullName.localeCompare(b.profile.name.fullName)
        );

        setCourseWork(sortedWork);
        setAnnouncements(sortedAnns);
        setStudents(sortedStuds);
        setTopics(tpcs);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar detalhes da turma';
        setError(message);
        addToast(message, 'error');
      } finally {
        setLoadingDetails(false);
      }
    },
    [
      accessToken,
      setSelectedCourses,
      setCourseWork,
      setAnnouncements,
      setStudents,
      setTopics,
      setLoadingDetails,
      setError,
      addToast,
    ]
  );

  /**
   * Carrega detalhes de multiplas turmas
   */
  const loadMultipleCourseDetails = useCallback(
    async (courseIds: string[]) => {
      if (!accessToken) {
        setError('Token de acesso nao disponivel.');
        return;
      }

      if (courseIds.length === 0) {
        setCourseWork([]);
        setAnnouncements([]);
        setStudents([]);
        setTopics([]);
        return;
      }

      setLoadingDetails(true);
      setError(null);

      try {
        const service = createClassroomService(accessToken);

        // Carregar dados de todas as turmas em paralelo
        const results = await Promise.all(
          courseIds.map(async (courseId) => {
            const [work, anns, studs, tpcs] = await Promise.all([
              service.listCourseWork(courseId, { courseWorkStates: ['PUBLISHED'] }),
              service.listAnnouncements(courseId, { announcementStates: ['PUBLISHED'] }),
              service.listStudents(courseId),
              service.listTopics(courseId),
            ]);
            return { courseId, work, anns, studs, tpcs };
          })
        );

        // Combinar resultados
        let allWork: ClassroomCourseWork[] = [];
        let allAnns: ClassroomAnnouncement[] = [];
        let allStuds: ClassroomStudent[] = [];
        let allTopics: ClassroomTopic[] = [];

        for (const result of results) {
          allWork = [...allWork, ...result.work];
          allAnns = [...allAnns, ...result.anns];
          allStuds = [...allStuds, ...result.studs];
          allTopics = [...allTopics, ...result.tpcs];
        }

        // Ordenar atividades por data de criacao (mais recentes primeiro)
        allWork.sort(
          (a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
        );

        // Ordenar anuncios por data
        allAnns.sort(
          (a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
        );

        // Ordenar alunos por nome
        allStuds.sort((a, b) =>
          a.profile.name.fullName.localeCompare(b.profile.name.fullName)
        );

        setCourseWork(allWork);
        setAnnouncements(allAnns);
        setStudents(allStuds);
        setTopics(allTopics);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar detalhes das turmas';
        setError(message);
        addToast(message, 'error');
      } finally {
        setLoadingDetails(false);
      }
    },
    [
      accessToken,
      setCourseWork,
      setAnnouncements,
      setStudents,
      setTopics,
      setLoadingDetails,
      setError,
      addToast,
    ]
  );

  /**
   * Toggle de selecao de turma (adiciona ou remove)
   */
  const handleToggleCourse = useCallback(
    async (courseId: string) => {
      const newSelectedIds = selectedCourseIds.includes(courseId)
        ? selectedCourseIds.filter((id) => id !== courseId)
        : [...selectedCourseIds, courseId];

      toggleSelectedCourse(courseId);

      // Recarregar dados
      await loadMultipleCourseDetails(newSelectedIds);
    },
    [selectedCourseIds, toggleSelectedCourse, loadMultipleCourseDetails]
  );

  /**
   * Carrega entregas de uma atividade especifica
   */
  const loadSubmissions = useCallback(
    async (courseId: string, courseWorkId: string) => {
      if (!accessToken) return;

      try {
        const service = createClassroomService(accessToken);
        const subs = await service.listSubmissions(courseId, courseWorkId);
        setSubmissions(courseWorkId, subs);
      } catch (err) {
        console.error('Erro ao carregar entregas:', err);
      }
    },
    [accessToken, setSubmissions]
  );

  /**
   * Atualiza dados das turmas selecionadas
   */
  const refreshSelectedCourses = useCallback(async () => {
    if (selectedCourseIds.length > 0) {
      await loadMultipleCourseDetails(selectedCourseIds);
    }
  }, [selectedCourseIds, loadMultipleCourseDetails]);

  // Turmas selecionadas
  const selectedCourses = courses.filter((c) => selectedCourseIds.includes(c.id));

  // Helper para obter nome da turma pelo ID
  const getCourseNameById = useCallback(
    (courseId: string) => {
      const course = courses.find((c) => c.id === courseId);
      return course?.name || courseId;
    },
    [courses]
  );

  // Estatisticas calculadas
  const stats = {
    totalStudents: students.length,
    totalCourseWork: courseWork.length,
    totalAnnouncements: announcements.length,
  };

  return {
    // Dados
    courses,
    selectedCourses,
    selectedCourseIds,
    courseWork,
    announcements,
    students,
    submissions,
    topics,
    stats,

    // Estado
    isLoading,
    isLoadingDetails,
    error,
    lastSync,
    isConnected: !!accessToken,

    // Acoes
    loadCourses,
    loadCourseDetails,
    loadMultipleCourseDetails,
    handleToggleCourse,
    loadSubmissions,
    refreshSelectedCourses,
    setSelectedCourses,

    // Helpers
    getCourseNameById,
  };
}
