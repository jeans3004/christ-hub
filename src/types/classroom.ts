/**
 * Tipos da API do Google Classroom.
 */

// ============================================
// TIPOS DA API DO GOOGLE CLASSROOM
// ============================================

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  ownerId: string;
  creationTime: string;
  updateTime: string;
  enrollmentCode?: string;
  courseState: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
  alternateLink: string;
  teacherGroupEmail?: string;
  courseGroupEmail?: string;
  guardiansEnabled?: boolean;
  calendarId?: string;
}

export interface ClassroomUserProfile {
  id: string;
  name: {
    givenName: string;
    familyName: string;
    fullName: string;
  };
  emailAddress: string;
  photoUrl?: string;
  permissions?: Array<{ permission: string }>;
}

export interface ClassroomTeacher {
  courseId: string;
  userId: string;
  profile: ClassroomUserProfile;
}

export interface ClassroomStudent {
  courseId: string;
  userId: string;
  profile: ClassroomUserProfile;
  studentWorkFolder?: {
    id: string;
    alternateLink: string;
  };
}

export interface ClassroomMaterial {
  driveFile?: {
    driveFile: {
      id: string;
      title: string;
      alternateLink: string;
      thumbnailUrl?: string;
    };
    shareMode: 'VIEW' | 'EDIT' | 'STUDENT_COPY';
  };
  youtubeVideo?: {
    id: string;
    title: string;
    alternateLink: string;
    thumbnailUrl?: string;
  };
  link?: {
    url: string;
    title?: string;
    thumbnailUrl?: string;
  };
  form?: {
    formUrl: string;
    title: string;
    responseUrl?: string;
    thumbnailUrl?: string;
  };
}

export interface ClassroomCourseWork {
  courseId: string;
  id: string;
  title: string;
  description?: string;
  materials?: ClassroomMaterial[];
  state: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  alternateLink: string;
  creationTime: string;
  updateTime: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours: number;
    minutes: number;
    seconds?: number;
  };
  scheduledTime?: string;
  maxPoints?: number;
  workType: 'ASSIGNMENT' | 'SHORT_ANSWER_QUESTION' | 'MULTIPLE_CHOICE_QUESTION';
  associatedWithDeveloper?: boolean;
  topicId?: string;
  creatorUserId: string;
}

export interface ClassroomCourseWorkMaterial {
  courseId: string;
  id: string;
  title: string;
  description?: string;
  materials?: ClassroomMaterial[];
  state: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  alternateLink: string;
  creationTime: string;
  updateTime: string;
  scheduledTime?: string;
  topicId?: string;
  creatorUserId: string;
}

export interface ClassroomStudentSubmission {
  courseId: string;
  courseWorkId: string;
  id: string;
  userId: string;
  creationTime: string;
  updateTime: string;
  state: 'NEW' | 'CREATED' | 'TURNED_IN' | 'RETURNED' | 'RECLAIMED_BY_STUDENT';
  late?: boolean;
  draftGrade?: number;
  assignedGrade?: number;
  alternateLink: string;
  courseWorkType: 'ASSIGNMENT' | 'SHORT_ANSWER_QUESTION' | 'MULTIPLE_CHOICE_QUESTION';
  assignmentSubmission?: {
    attachments?: ClassroomMaterial[];
  };
  shortAnswerSubmission?: {
    answer: string;
  };
  multipleChoiceSubmission?: {
    answer: string;
  };
}

export interface ClassroomAnnouncement {
  courseId: string;
  id: string;
  text: string;
  materials?: ClassroomMaterial[];
  state: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  alternateLink: string;
  creationTime: string;
  updateTime: string;
  scheduledTime?: string;
  assigneeMode?: 'ALL_STUDENTS' | 'INDIVIDUAL_STUDENTS';
  creatorUserId: string;
}

export interface ClassroomTopic {
  courseId: string;
  topicId: string;
  name: string;
  updateTime: string;
}

export interface ClassroomInvitation {
  id: string;
  userId: string;
  courseId: string;
  role: 'STUDENT' | 'TEACHER' | 'OWNER';
}

export interface ClassroomInvitationWithProfile extends ClassroomInvitation {
  profile: ClassroomUserProfile | null;
}

// ============================================
// TIPOS AUXILIARES DO MODULO
// ============================================

export interface CourseStats {
  totalStudents: number;
  totalCourseWork: number;
  totalAnnouncements: number;
  pendingSubmissions: number;
  lateSubmissions: number;
}

export interface SubmissionSummary {
  courseWorkId: string;
  courseWorkTitle: string;
  total: number;
  turnedIn: number;
  returned: number;
  pending: number;
  late: number;
}

export interface ClassroomExportOptions {
  tipo: 'atividades' | 'notas' | 'entregas' | 'alunos';
  formato: 'xlsx' | 'csv';
  courseId: string;
  courseName: string;
}

// ============================================
// ESTADO DO STORE
// ============================================

export interface ClassroomStoreState {
  // Dados
  courses: ClassroomCourse[];
  selectedCourseIds: string[];
  courseWork: ClassroomCourseWork[];
  announcements: ClassroomAnnouncement[];
  students: ClassroomStudent[];
  teachers: ClassroomTeacher[];
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
  setSubmissions: (courseWorkId: string, submissions: ClassroomStudentSubmission[]) => void;
  setTopics: (topics: ClassroomTopic[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadingDetails: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastSync: (date: Date) => void;
  reset: () => void;
}

// ============================================
// TEMPLATES E CRIACAO
// ============================================

export type ClassroomPostType = 'announcement' | 'assignment' | 'question';

export interface ClassroomAttachment {
  type: 'link' | 'driveFile' | 'youtubeVideo';
  url?: string;
  title?: string;
  driveFileId?: string;
  youtubeVideoId?: string;
}

export interface ClassroomTemplate {
  id: string;
  nome: string;
  tipo: ClassroomPostType;
  texto: string;
  anexos?: ClassroomAttachment[];
  // Para atividades
  pontuacao?: number;
  prazoEmDias?: number;
  // Metadata
  criadoPorId: string;
  criadoPorNome: string;
  usageCount: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnnouncementPayload {
  text: string;
  materials?: ClassroomMaterialPayload[];
  state?: 'PUBLISHED' | 'DRAFT';
  assigneeMode?: 'ALL_STUDENTS' | 'INDIVIDUAL_STUDENTS';
  individualStudentsOptions?: {
    studentIds: string[];
  };
}

export interface CreateCourseWorkPayload {
  title: string;
  description?: string;
  materials?: ClassroomMaterialPayload[];
  state?: 'PUBLISHED' | 'DRAFT';
  workType: 'ASSIGNMENT' | 'SHORT_ANSWER_QUESTION' | 'MULTIPLE_CHOICE_QUESTION';
  maxPoints?: number;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours: number; minutes: number };
  topicId?: string;
  multipleChoiceQuestion?: {
    choices: string[];
  };
  assigneeMode?: 'ALL_STUDENTS' | 'INDIVIDUAL_STUDENTS';
  individualStudentsOptions?: {
    studentIds: string[];
  };
}

export interface ClassroomMaterialPayload {
  link?: { url: string; title?: string };
  driveFile?: { driveFile: { id: string } };
  youtubeVideo?: { id: string };
}

export interface MultiPostResult {
  courseId: string;
  courseName: string;
  success: boolean;
  error?: string;
}

// ============================================
// SECOES POR AREA DE CONHECIMENTO
// ============================================

export interface CourseSection {
  id: string;
  name: string;
  color: string;
  studentIds: string[];
}

export interface CourseSectionsConfig {
  courseId: string;
  sections: CourseSection[];
  updatedAt: Date;
  topicSectionMap?: Record<string, string>; // topicId → sectionId
}
