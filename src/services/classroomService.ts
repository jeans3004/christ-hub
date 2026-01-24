/**
 * Servico de integracao com Google Classroom.
 * Cliente para a API REST do Classroom.
 */

import type {
  ClassroomCourse,
  ClassroomCourseWork,
  ClassroomCourseWorkMaterial,
  ClassroomStudentSubmission,
  ClassroomAnnouncement,
  ClassroomStudent,
  ClassroomTeacher,
  ClassroomTopic,
  CreateAnnouncementPayload,
  CreateCourseWorkPayload,
} from '@/types/classroom';

const CLASSROOM_API_BASE = 'https://classroom.googleapis.com/v1';

/**
 * Cria uma instancia do servico do Classroom com o token de acesso
 */
export function createClassroomService(accessToken: string) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Erro ${response.status}: ${response.statusText}`);
    }
    return response.json();
  };

  return {
    // ==========================================
    // TURMAS (COURSES)
    // ==========================================

    /**
     * Lista todas as turmas do professor autenticado
     */
    async listCourses(params?: {
      teacherId?: string;
      studentId?: string;
      courseStates?: ('ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED')[];
      pageSize?: number;
      pageToken?: string;
    }): Promise<{ courses: ClassroomCourse[]; nextPageToken?: string }> {
      const queryParams = new URLSearchParams();
      if (params?.teacherId) queryParams.set('teacherId', params.teacherId);
      if (params?.studentId) queryParams.set('studentId', params.studentId);
      if (params?.courseStates) queryParams.set('courseStates', params.courseStates.join(','));
      if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
      if (params?.pageToken) queryParams.set('pageToken', params.pageToken);

      const response = await fetch(`${CLASSROOM_API_BASE}/courses?${queryParams}`, { headers });
      const data = await handleResponse<{ courses?: ClassroomCourse[]; nextPageToken?: string }>(response);
      return { courses: data.courses || [], nextPageToken: data.nextPageToken };
    },

    /**
     * Obtem detalhes de uma turma especifica
     */
    async getCourse(courseId: string): Promise<ClassroomCourse> {
      const response = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}`, { headers });
      return handleResponse<ClassroomCourse>(response);
    },

    // ==========================================
    // ALUNOS E PROFESSORES (ROSTERS)
    // ==========================================

    /**
     * Lista alunos de uma turma
     */
    async listStudents(courseId: string, pageSize = 100): Promise<ClassroomStudent[]> {
      const allStudents: ClassroomStudent[] = [];
      let pageToken: string | undefined;

      do {
        const queryParams = new URLSearchParams({ pageSize: pageSize.toString() });
        if (pageToken) queryParams.set('pageToken', pageToken);

        const response = await fetch(
          `${CLASSROOM_API_BASE}/courses/${courseId}/students?${queryParams}`,
          { headers }
        );
        const data = await handleResponse<{ students?: ClassroomStudent[]; nextPageToken?: string }>(response);

        if (data.students) allStudents.push(...data.students);
        pageToken = data.nextPageToken;
      } while (pageToken);

      return allStudents;
    },

    /**
     * Lista professores de uma turma
     */
    async listTeachers(courseId: string): Promise<ClassroomTeacher[]> {
      const response = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}/teachers`, { headers });
      const data = await handleResponse<{ teachers?: ClassroomTeacher[] }>(response);
      return data.teachers || [];
    },

    // ==========================================
    // ATIVIDADES (COURSEWORK)
    // ==========================================

    /**
     * Lista atividades de uma turma
     */
    async listCourseWork(
      courseId: string,
      params?: {
        courseWorkStates?: ('PUBLISHED' | 'DRAFT' | 'DELETED')[];
        orderBy?: string;
        pageSize?: number;
      }
    ): Promise<ClassroomCourseWork[]> {
      const allCourseWork: ClassroomCourseWork[] = [];
      let pageToken: string | undefined;

      do {
        const queryParams = new URLSearchParams();
        if (params?.courseWorkStates) queryParams.set('courseWorkStates', params.courseWorkStates.join(','));
        if (params?.orderBy) queryParams.set('orderBy', params.orderBy);
        if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
        if (pageToken) queryParams.set('pageToken', pageToken);

        const response = await fetch(
          `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork?${queryParams}`,
          { headers }
        );
        const data = await handleResponse<{ courseWork?: ClassroomCourseWork[]; nextPageToken?: string }>(response);

        if (data.courseWork) allCourseWork.push(...data.courseWork);
        pageToken = data.nextPageToken;
      } while (pageToken);

      return allCourseWork;
    },

    /**
     * Obtem detalhes de uma atividade
     */
    async getCourseWork(courseId: string, courseWorkId: string): Promise<ClassroomCourseWork> {
      const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork/${courseWorkId}`,
        { headers }
      );
      return handleResponse<ClassroomCourseWork>(response);
    },

    // ==========================================
    // MATERIAIS (COURSEWORK MATERIALS)
    // ==========================================

    /**
     * Lista materiais de uma turma
     */
    async listCourseWorkMaterials(courseId: string): Promise<ClassroomCourseWorkMaterial[]> {
      const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/courseWorkMaterials`,
        { headers }
      );
      const data = await handleResponse<{ courseWorkMaterial?: ClassroomCourseWorkMaterial[] }>(response);
      return data.courseWorkMaterial || [];
    },

    // ==========================================
    // ENTREGAS (STUDENT SUBMISSIONS)
    // ==========================================

    /**
     * Lista entregas de uma atividade
     */
    async listSubmissions(
      courseId: string,
      courseWorkId: string,
      params?: {
        userId?: string;
        states?: ('NEW' | 'CREATED' | 'TURNED_IN' | 'RETURNED' | 'RECLAIMED_BY_STUDENT')[];
        late?: 'LATE_ONLY' | 'NOT_LATE_ONLY';
        pageSize?: number;
      }
    ): Promise<ClassroomStudentSubmission[]> {
      const allSubmissions: ClassroomStudentSubmission[] = [];
      let pageToken: string | undefined;

      do {
        const queryParams = new URLSearchParams();
        if (params?.userId) queryParams.set('userId', params.userId);
        if (params?.states) queryParams.set('states', params.states.join(','));
        if (params?.late) queryParams.set('late', params.late);
        if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
        if (pageToken) queryParams.set('pageToken', pageToken);

        const response = await fetch(
          `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions?${queryParams}`,
          { headers }
        );
        const data = await handleResponse<{ studentSubmissions?: ClassroomStudentSubmission[]; nextPageToken?: string }>(response);

        if (data.studentSubmissions) allSubmissions.push(...data.studentSubmissions);
        pageToken = data.nextPageToken;
      } while (pageToken);

      return allSubmissions;
    },

    // ==========================================
    // ANUNCIOS (ANNOUNCEMENTS)
    // ==========================================

    /**
     * Lista anuncios de uma turma
     */
    async listAnnouncements(
      courseId: string,
      params?: {
        announcementStates?: ('PUBLISHED' | 'DRAFT' | 'DELETED')[];
        orderBy?: string;
        pageSize?: number;
      }
    ): Promise<ClassroomAnnouncement[]> {
      const allAnnouncements: ClassroomAnnouncement[] = [];
      let pageToken: string | undefined;

      do {
        const queryParams = new URLSearchParams();
        if (params?.announcementStates) queryParams.set('announcementStates', params.announcementStates.join(','));
        if (params?.orderBy) queryParams.set('orderBy', params.orderBy);
        if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
        if (pageToken) queryParams.set('pageToken', pageToken);

        const response = await fetch(
          `${CLASSROOM_API_BASE}/courses/${courseId}/announcements?${queryParams}`,
          { headers }
        );
        const data = await handleResponse<{ announcements?: ClassroomAnnouncement[]; nextPageToken?: string }>(response);

        if (data.announcements) allAnnouncements.push(...data.announcements);
        pageToken = data.nextPageToken;
      } while (pageToken);

      return allAnnouncements;
    },

    // ==========================================
    // TOPICOS (TOPICS)
    // ==========================================

    /**
     * Lista topicos de uma turma
     */
    async listTopics(courseId: string): Promise<ClassroomTopic[]> {
      const response = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}/topics`, { headers });
      const data = await handleResponse<{ topic?: ClassroomTopic[] }>(response);
      return data.topic || [];
    },

    // ==========================================
    // CRIACAO DE CONTEUDO
    // ==========================================

    /**
     * Cria um anuncio em uma turma
     */
    async createAnnouncement(
      courseId: string,
      payload: CreateAnnouncementPayload
    ): Promise<ClassroomAnnouncement> {
      const response = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}/announcements`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          state: payload.state || 'PUBLISHED',
        }),
      });
      return handleResponse<ClassroomAnnouncement>(response);
    },

    /**
     * Cria uma atividade em uma turma
     */
    async createCourseWork(
      courseId: string,
      payload: CreateCourseWorkPayload
    ): Promise<ClassroomCourseWork> {
      const response = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}/courseWork`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          state: payload.state || 'PUBLISHED',
        }),
      });
      return handleResponse<ClassroomCourseWork>(response);
    },

    /**
     * Cria um topico em uma turma
     */
    async createTopic(courseId: string, name: string): Promise<ClassroomTopic> {
      const response = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}/topics`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name }),
      });
      return handleResponse<ClassroomTopic>(response);
    },

    /**
     * Atualiza um topico
     */
    async updateTopic(courseId: string, topicId: string, name: string): Promise<ClassroomTopic> {
      const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/topics/${topicId}?updateMask=name`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ name }),
        }
      );
      return handleResponse<ClassroomTopic>(response);
    },

    /**
     * Exclui um topico
     */
    async deleteTopic(courseId: string, topicId: string): Promise<void> {
      const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/topics/${topicId}`,
        {
          method: 'DELETE',
          headers,
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Erro ${response.status}: ${response.statusText}`);
      }
    },

    /**
     * Atualiza um anuncio
     */
    async updateAnnouncement(
      courseId: string,
      announcementId: string,
      payload: { text?: string; state?: 'PUBLISHED' | 'DRAFT' },
      updateMask: string[]
    ): Promise<ClassroomAnnouncement> {
      const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/announcements/${announcementId}?updateMask=${updateMask.join(',')}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        }
      );
      return handleResponse<ClassroomAnnouncement>(response);
    },

    /**
     * Atualiza uma atividade (coursework)
     */
    async updateCourseWork(
      courseId: string,
      courseWorkId: string,
      payload: {
        title?: string;
        description?: string;
        state?: 'PUBLISHED' | 'DRAFT';
        dueDate?: { year: number; month: number; day: number };
        dueTime?: { hours: number; minutes: number };
        maxPoints?: number;
        topicId?: string;
      },
      updateMask: string[]
    ): Promise<ClassroomCourseWork> {
      const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork/${courseWorkId}?updateMask=${updateMask.join(',')}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        }
      );
      return handleResponse<ClassroomCourseWork>(response);
    },

    /**
     * Exclui um anuncio
     */
    async deleteAnnouncement(courseId: string, announcementId: string): Promise<void> {
      const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/announcements/${announcementId}`,
        {
          method: 'DELETE',
          headers,
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Erro ${response.status}: ${response.statusText}`);
      }
    },

    /**
     * Exclui uma atividade (coursework)
     */
    async deleteCourseWork(courseId: string, courseWorkId: string): Promise<void> {
      const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork/${courseWorkId}`,
        {
          method: 'DELETE',
          headers,
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Erro ${response.status}: ${response.statusText}`);
      }
    },
  };
}

export type ClassroomService = ReturnType<typeof createClassroomService>;
