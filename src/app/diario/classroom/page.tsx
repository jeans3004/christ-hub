/**
 * Pagina de integracao com Google Classroom.
 * Permite visualizar turmas, atividades, anuncios e alunos do Classroom.
 * Suporta selecao de multiplas turmas.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  Alert,
  Chip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  FileDownload as ExportIcon,
  Add as AddIcon,
  Topic as TopicIcon,
  PersonAdd as PersonAddIcon,
  GroupAdd as GroupAddIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useClassroomLoader, useClassroomActions } from './hooks';
import {
  CourseList,
  CourseworkTable,
  AnnouncementsTimeline,
  StudentsTable,
  TeachersTable,
  ExportModal,
  ClassroomComposer,
  TopicsManager,
  SectionManager,
  InviteTeacherModal,
  InviteStudentModal,
} from './components';

type TabValue = 'turmas' | 'atividades' | 'anuncios' | 'alunos' | 'professores';

export default function ClassroomPage() {
  const { can } = usePermissions();
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>('turmas');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [inviteTeacherOpen, setInviteTeacherOpen] = useState(false);
  const [inviteStudentOpen, setInviteStudentOpen] = useState(false);

  const {
    courses,
    selectedCourses,
    selectedCourseIds,
    courseWork,
    announcements,
    students,
    teachers,
    invitations,
    submissions,
    topics,
    stats,
    isLoading,
    isLoadingDetails,
    error,
    lastSync,
    isConnected,
    loadCourses,
    handleToggleCourse,
    loadSubmissions,
    refreshSelectedCourses,
    getCourseNameById,
  } = useClassroomLoader();

  const {
    exportCourseWork,
    exportGrades,
    exportStudents,
    getSubmissionStats,
    deleteAnnouncement,
    deleteCourseWork,
    deleteMultipleAnnouncements,
    deleteMultipleCourseWork,
    editAnnouncement,
    editCourseWork,
    inviteTeacher,
    removeTeacher,
    cancelInvitation,
  } = useClassroomActions();

  // Carregar turmas ao montar
  useEffect(() => {
    if (isConnected) {
      loadCourses();
    }
  }, [isConnected, loadCourses]);

  // Verificar permissao
  if (!can('classroom:view')) {
    return (
      <MainLayout title="Google Classroom">
        <Alert severity="error">Voce nao tem permissao para acessar esta pagina.</Alert>
      </MainLayout>
    );
  }

  // Token nao disponivel
  if (!isConnected) {
    return (
      <MainLayout title="Google Classroom">
        <Alert severity="warning">
          Faca login novamente para conectar ao Google Classroom. O token de acesso pode ter
          expirado.
        </Alert>
      </MainLayout>
    );
  }

  const handleCourseToggle = (courseId: string) => {
    handleToggleCourse(courseId);
    // Se pelo menos uma turma selecionada, mudar para aba de atividades
    const willBeSelected = !selectedCourseIds.includes(courseId);
    if (willBeSelected && selectedCourseIds.length === 0) {
      setActiveTab('atividades');
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  const handleAnnouncementCreated = () => {
    setComposerOpen(false);
    if (selectedCourseIds.length > 0) {
      refreshSelectedCourses();
    }
  };

  const handleDeleteAnnouncement = async (courseId: string, announcementId: string) => {
    await deleteAnnouncement(courseId, announcementId);
    refreshSelectedCourses();
  };

  const handleDeleteMultipleAnnouncements = async (items: { courseId: string; announcementId: string }[]) => {
    await deleteMultipleAnnouncements(items);
    refreshSelectedCourses();
  };

  const handleEditAnnouncement = async (courseId: string, announcementId: string, text: string) => {
    await editAnnouncement(courseId, announcementId, text);
    refreshSelectedCourses();
  };

  const handleDeleteCourseWork = async (courseId: string, courseWorkId: string) => {
    await deleteCourseWork(courseId, courseWorkId);
    refreshSelectedCourses();
  };

  const handleDeleteMultipleCourseWork = async (items: { courseId: string; courseWorkId: string }[]) => {
    await deleteMultipleCourseWork(items);
    refreshSelectedCourses();
  };

  const handleEditCourseWork = async (
    courseId: string,
    courseWorkId: string,
    data: {
      title?: string;
      description?: string;
      maxPoints?: number;
      topicId?: string;
      dueDate?: { year: number; month: number; day: number } | null;
    }
  ) => {
    await editCourseWork(courseId, courseWorkId, data);
    refreshSelectedCourses();
  };

  const handleInviteTeacher = async (email: string, courseIds: string[]) => {
    const results = await inviteTeacher(email, courseIds);
    // Refresh para mostrar novos professores
    if (results.some((r) => r.success)) {
      refreshSelectedCourses();
    }
    return results;
  };

  const handleRemoveTeacher = async (courseId: string, userId: string) => {
    await removeTeacher(courseId, userId);
    refreshSelectedCourses();
  };

  const handleCancelInvitation = async (invitationId: string) => {
    await cancelInvitation(invitationId);
    refreshSelectedCourses();
  };

  const isMultiCourse = selectedCourseIds.length > 1;
  const hasSelectedCourses = selectedCourseIds.length > 0;

  return (
    <MainLayout title="Google Classroom">
      <Box sx={{ maxWidth: 'xl', mx: 'auto' }}>
        {/* Header */}
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}
        >
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Google Classroom
            </Typography>
            {lastSync && (
              <Typography variant="body2" color="text.secondary">
                Ultima sincronizacao: {lastSync.toLocaleTimeString('pt-BR')}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={hasSelectedCourses ? refreshSelectedCourses : loadCourses}
              disabled={isLoading || isLoadingDetails}
            >
              Atualizar
            </Button>
            {can('classroom:post') && (
              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => setComposerOpen(true)}
              >
                Nova Publicacao
              </Button>
            )}
            {hasSelectedCourses && can('classroom:post') && (
              <>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<TopicIcon />}
                  onClick={() => setTopicsOpen(true)}
                >
                  Temas
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<CategoryIcon />}
                  onClick={() => setSectionsOpen(true)}
                >
                  Secoes
                </Button>
              </>
            )}
            {can('classroom:post') && (
              <>
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<GroupAddIcon />}
                  onClick={() => setInviteStudentOpen(true)}
                >
                  Convidar Aluno
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setInviteTeacherOpen(true)}
                >
                  Convidar Professor
                </Button>
              </>
            )}
            {hasSelectedCourses && can('classroom:export') && (
              <Button
                variant="contained"
                startIcon={<ExportIcon />}
                onClick={() => setExportModalOpen(true)}
              >
                Exportar
              </Button>
            )}
          </Box>
        </Box>

        {/* Erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Turmas selecionadas */}
        {hasSelectedCourses && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <strong>
                {selectedCourses.length === 1
                  ? 'Turma selecionada:'
                  : `${selectedCourses.length} turmas selecionadas:`}
              </strong>
              {selectedCourses.map((course) => (
                <Chip
                  key={course.id}
                  label={course.name}
                  size="small"
                  onDelete={() => handleToggleCourse(course.id)}
                  sx={{ ml: 0.5 }}
                />
              ))}
              <Chip
                label="Gerenciar"
                size="small"
                onClick={() => setActiveTab('turmas')}
                color="primary"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </Box>
          </Alert>
        )}

        {/* Abas */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab
              icon={<SchoolIcon />}
              iconPosition="start"
              label={`Turmas (${courses.length})`}
              value="turmas"
            />
            <Tab
              icon={<AssignmentIcon />}
              iconPosition="start"
              label={`Atividades (${stats.totalCourseWork})`}
              value="atividades"
              disabled={!hasSelectedCourses}
            />
            <Tab
              icon={<CampaignIcon />}
              iconPosition="start"
              label={`Anuncios (${stats.totalAnnouncements})`}
              value="anuncios"
              disabled={!hasSelectedCourses}
            />
            <Tab
              icon={<PeopleIcon />}
              iconPosition="start"
              label={`Alunos (${stats.totalStudents})`}
              value="alunos"
              disabled={!hasSelectedCourses}
            />
            <Tab
              icon={<PersonIcon />}
              iconPosition="start"
              label={`Professores (${stats.totalTeachers})`}
              value="professores"
              disabled={!hasSelectedCourses}
            />
          </Tabs>
        </Box>

        {/* Conteudo das abas */}
        {activeTab === 'turmas' && (
          <CourseList
            courses={courses}
            selectedCourseIds={selectedCourseIds}
            isLoading={isLoading}
            onToggle={handleCourseToggle}
          />
        )}

        {activeTab === 'atividades' && hasSelectedCourses && (
          <CourseworkTable
            courseWork={courseWork}
            students={students}
            submissions={submissions}
            topics={topics}
            isLoading={isLoadingDetails}
            onLoadSubmissions={(cwId) => {
              const cw = courseWork.find((c) => c.id === cwId);
              if (cw) loadSubmissions(cw.courseId, cwId);
            }}
            getSubmissionStats={getSubmissionStats}
            getCourseNameById={getCourseNameById}
            isMultiCourse={isMultiCourse}
            onDeleteCourseWork={can('classroom:post') ? handleDeleteCourseWork : undefined}
            onDeleteMultipleCourseWork={can('classroom:post') ? handleDeleteMultipleCourseWork : undefined}
            onEditCourseWork={can('classroom:post') ? handleEditCourseWork : undefined}
            canDelete={can('classroom:post')}
            canEdit={can('classroom:post')}
          />
        )}

        {activeTab === 'anuncios' && hasSelectedCourses && (
          <AnnouncementsTimeline
            announcements={announcements}
            teachers={teachers}
            isLoading={isLoadingDetails}
            onNewAnnouncement={can('classroom:post') ? () => setComposerOpen(true) : undefined}
            onDeleteAnnouncement={can('classroom:post') ? handleDeleteAnnouncement : undefined}
            onDeleteMultipleAnnouncements={can('classroom:post') ? handleDeleteMultipleAnnouncements : undefined}
            onEditAnnouncement={can('classroom:post') ? handleEditAnnouncement : undefined}
            getCourseNameById={getCourseNameById}
            isMultiCourse={isMultiCourse}
            canDelete={can('classroom:post')}
            canEdit={can('classroom:post')}
          />
        )}

        {activeTab === 'alunos' && hasSelectedCourses && (
          <StudentsTable
            students={students}
            isLoading={isLoadingDetails}
            getCourseNameById={getCourseNameById}
            isMultiCourse={isMultiCourse}
          />
        )}

        {activeTab === 'professores' && hasSelectedCourses && (
          <TeachersTable
            teachers={teachers}
            invitations={invitations}
            isLoading={isLoadingDetails}
            getCourseNameById={getCourseNameById}
            isMultiCourse={isMultiCourse}
            onCancelInvitation={can('classroom:post') ? handleCancelInvitation : undefined}
          />
        )}

        {/* Modal de exportacao */}
        <ExportModal
          open={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          courseName={
            selectedCourses.length === 1
              ? selectedCourses[0].name
              : `${selectedCourses.length} turmas`
          }
          onExportCourseWork={(formato) =>
            exportCourseWork(courseWork, selectedCourses[0]?.name || 'turmas', formato)
          }
          onExportGrades={(formato) =>
            exportGrades(courseWork, students, submissions, selectedCourses[0]?.name || 'turmas', formato)
          }
          onExportStudents={(formato) =>
            exportStudents(students, selectedCourses[0]?.name || 'turmas', formato)
          }
        />

        {/* Compositor avancado */}
        <ClassroomComposer
          open={composerOpen}
          onClose={() => setComposerOpen(false)}
          courses={courses}
          topics={topics}
          defaultCourseId={selectedCourseIds[0] || undefined}
          onSuccess={handleAnnouncementCreated}
          userId={usuario?.id || ''}
          userName={usuario?.nome || ''}
        />

        {/* Gerenciador de temas */}
        <TopicsManager
          open={topicsOpen}
          onClose={() => setTopicsOpen(false)}
          courses={selectedCourses}
          topics={topics}
          onTopicCreated={refreshSelectedCourses}
          getCourseNameById={getCourseNameById}
        />

        {/* Gerenciador de secoes */}
        <SectionManager
          open={sectionsOpen}
          onClose={() => setSectionsOpen(false)}
          courses={selectedCourses}
          students={students}
          onSectionsUpdated={refreshSelectedCourses}
        />

        {/* Modal de convite de aluno */}
        <InviteStudentModal
          open={inviteStudentOpen}
          onClose={() => setInviteStudentOpen(false)}
          courses={courses}
          onStudentInvited={refreshSelectedCourses}
        />

        {/* Modal de convite de professor */}
        <InviteTeacherModal
          open={inviteTeacherOpen}
          onClose={() => setInviteTeacherOpen(false)}
          courses={courses}
          onInvite={handleInviteTeacher}
        />
      </Box>
    </MainLayout>
  );
}
