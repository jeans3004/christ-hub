/**
 * Hook de acoes do Google Classroom (exportacao, estatisticas).
 */

'use client';

import { useCallback } from 'react';
import { useDriveStore } from '@/store/driveStore';
import { useUIStore } from '@/store/uiStore';
import { createClassroomService } from '@/services/classroomService';
import type {
  ClassroomCourseWork,
  ClassroomStudentSubmission,
  ClassroomStudent,
} from '@/types/classroom';
import * as XLSX from 'xlsx';

export function useClassroomActions() {
  const { accessToken } = useDriveStore();
  const { addToast } = useUIStore();

  /**
   * Exporta atividades para planilha
   */
  const exportCourseWork = useCallback(
    (courseWork: ClassroomCourseWork[], courseName: string, formato: 'xlsx' | 'csv' = 'xlsx') => {
      try {
        const data = courseWork.map((cw) => ({
          Titulo: cw.title,
          Descricao: cw.description || '',
          Tipo:
            cw.workType === 'ASSIGNMENT'
              ? 'Tarefa'
              : cw.workType === 'SHORT_ANSWER_QUESTION'
                ? 'Resposta Curta'
                : 'Multipla Escolha',
          'Pontuacao Maxima': cw.maxPoints || '-',
          'Data de Criacao': new Date(cw.creationTime).toLocaleDateString('pt-BR'),
          Prazo: cw.dueDate
            ? `${cw.dueDate.day.toString().padStart(2, '0')}/${cw.dueDate.month.toString().padStart(2, '0')}/${cw.dueDate.year}`
            : 'Sem prazo',
          Link: cw.alternateLink,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Atividades');

        const fileName = `Atividades_${courseName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`;
        XLSX.writeFile(wb, `${fileName}.${formato}`);

        addToast('Atividades exportadas com sucesso!', 'success');
      } catch (err) {
        addToast('Erro ao exportar atividades', 'error');
      }
    },
    [addToast]
  );

  /**
   * Exporta notas/entregas para planilha
   */
  const exportGrades = useCallback(
    (
      courseWork: ClassroomCourseWork[],
      students: ClassroomStudent[],
      submissions: Map<string, ClassroomStudentSubmission[]>,
      courseName: string,
      formato: 'xlsx' | 'csv' = 'xlsx'
    ) => {
      try {
        // Criar cabecalhos: Nome do Aluno + cada atividade
        const headers = ['Aluno', 'Email', ...courseWork.map((cw) => cw.title)];

        // Criar linhas de dados
        const rows = students.map((student) => {
          const row: Record<string, string | number> = {
            Aluno: student.profile.name.fullName,
            Email: student.profile.emailAddress,
          };

          courseWork.forEach((cw) => {
            const cwSubmissions = submissions.get(cw.id) || [];
            const studentSub = cwSubmissions.find((s) => s.userId === student.userId);

            if (studentSub) {
              if (studentSub.assignedGrade !== undefined) {
                row[cw.title] = studentSub.assignedGrade;
              } else if (studentSub.state === 'TURNED_IN') {
                row[cw.title] = 'Entregue';
              } else if (studentSub.state === 'RETURNED') {
                row[cw.title] = 'Devolvido';
              } else {
                row[cw.title] = 'Pendente';
              }
            } else {
              row[cw.title] = '-';
            }
          });

          return row;
        });

        const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Notas');

        const fileName = `Notas_${courseName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`;
        XLSX.writeFile(wb, `${fileName}.${formato}`);

        addToast('Notas exportadas com sucesso!', 'success');
      } catch (err) {
        addToast('Erro ao exportar notas', 'error');
      }
    },
    [addToast]
  );

  /**
   * Exporta lista de alunos
   */
  const exportStudents = useCallback(
    (students: ClassroomStudent[], courseName: string, formato: 'xlsx' | 'csv' = 'xlsx') => {
      try {
        const data = students.map((s, index) => ({
          '#': index + 1,
          Nome: s.profile.name.fullName,
          Email: s.profile.emailAddress,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Alunos');

        const fileName = `Alunos_${courseName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`;
        XLSX.writeFile(wb, `${fileName}.${formato}`);

        addToast('Lista de alunos exportada com sucesso!', 'success');
      } catch (err) {
        addToast('Erro ao exportar alunos', 'error');
      }
    },
    [addToast]
  );

  /**
   * Calcula estatisticas de uma atividade
   */
  const getSubmissionStats = useCallback(
    (
      courseWorkId: string,
      submissions: Map<string, ClassroomStudentSubmission[]>,
      totalStudents: number
    ) => {
      const subs = submissions.get(courseWorkId) || [];

      const turnedIn = subs.filter((s) => s.state === 'TURNED_IN' || s.state === 'RETURNED').length;
      const late = subs.filter((s) => s.late).length;
      const graded = subs.filter((s) => s.assignedGrade !== undefined).length;
      const pending = totalStudents - turnedIn;

      return {
        total: totalStudents,
        turnedIn,
        pending,
        late,
        graded,
        percentComplete: totalStudents > 0 ? Math.round((turnedIn / totalStudents) * 100) : 0,
      };
    },
    []
  );

  /**
   * Exclui um anuncio
   */
  const deleteAnnouncement = useCallback(
    async (courseId: string, announcementId: string): Promise<void> => {
      if (!accessToken) {
        addToast('Token de acesso nao disponivel', 'error');
        throw new Error('Token de acesso nao disponivel');
      }

      try {
        const service = createClassroomService(accessToken);
        await service.deleteAnnouncement(courseId, announcementId);
        addToast('Anuncio excluido com sucesso!', 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao excluir anuncio';
        addToast(message, 'error');
        throw err;
      }
    },
    [accessToken, addToast]
  );

  /**
   * Exclui uma atividade (coursework)
   */
  const deleteCourseWork = useCallback(
    async (courseId: string, courseWorkId: string): Promise<void> => {
      if (!accessToken) {
        addToast('Token de acesso nao disponivel', 'error');
        throw new Error('Token de acesso nao disponivel');
      }

      try {
        const service = createClassroomService(accessToken);
        await service.deleteCourseWork(courseId, courseWorkId);
        addToast('Atividade excluida com sucesso!', 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao excluir atividade';
        addToast(message, 'error');
        throw err;
      }
    },
    [accessToken, addToast]
  );

  /**
   * Exclui multiplos anuncios
   */
  const deleteMultipleAnnouncements = useCallback(
    async (items: { courseId: string; announcementId: string }[]): Promise<void> => {
      if (!accessToken) {
        addToast('Token de acesso nao disponivel', 'error');
        throw new Error('Token de acesso nao disponivel');
      }

      const service = createClassroomService(accessToken);
      let successCount = 0;
      let errorCount = 0;

      for (const item of items) {
        try {
          await service.deleteAnnouncement(item.courseId, item.announcementId);
          successCount++;
        } catch {
          errorCount++;
        }
      }

      if (errorCount === 0) {
        addToast(`${successCount} anuncio(s) excluido(s) com sucesso!`, 'success');
      } else if (successCount > 0) {
        addToast(`${successCount} excluido(s), ${errorCount} erro(s)`, 'warning');
      } else {
        addToast('Erro ao excluir anuncios', 'error');
      }
    },
    [accessToken, addToast]
  );

  /**
   * Exclui multiplas atividades (coursework)
   */
  const deleteMultipleCourseWork = useCallback(
    async (items: { courseId: string; courseWorkId: string }[]): Promise<void> => {
      if (!accessToken) {
        addToast('Token de acesso nao disponivel', 'error');
        throw new Error('Token de acesso nao disponivel');
      }

      const service = createClassroomService(accessToken);
      let successCount = 0;
      let errorCount = 0;

      for (const item of items) {
        try {
          await service.deleteCourseWork(item.courseId, item.courseWorkId);
          successCount++;
        } catch {
          errorCount++;
        }
      }

      if (errorCount === 0) {
        addToast(`${successCount} atividade(s) excluida(s) com sucesso!`, 'success');
      } else if (successCount > 0) {
        addToast(`${successCount} excluida(s), ${errorCount} erro(s)`, 'warning');
      } else {
        addToast('Erro ao excluir atividades', 'error');
      }
    },
    [accessToken, addToast]
  );

  /**
   * Edita um anuncio
   */
  const editAnnouncement = useCallback(
    async (courseId: string, announcementId: string, text: string): Promise<void> => {
      if (!accessToken) {
        addToast('Token de acesso nao disponivel', 'error');
        throw new Error('Token de acesso nao disponivel');
      }

      try {
        const service = createClassroomService(accessToken);
        await service.updateAnnouncement(courseId, announcementId, { text }, ['text']);
        addToast('Anuncio atualizado com sucesso!', 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar anuncio';
        addToast(message, 'error');
        throw err;
      }
    },
    [accessToken, addToast]
  );

  /**
   * Edita uma atividade (coursework)
   */
  const editCourseWork = useCallback(
    async (
      courseId: string,
      courseWorkId: string,
      data: {
        title?: string;
        description?: string;
        maxPoints?: number;
        topicId?: string;
        dueDate?: { year: number; month: number; day: number } | null;
      }
    ): Promise<void> => {
      if (!accessToken) {
        addToast('Token de acesso nao disponivel', 'error');
        throw new Error('Token de acesso nao disponivel');
      }

      try {
        const service = createClassroomService(accessToken);
        const updateMask: string[] = [];
        const payload: Record<string, unknown> = {};

        if (data.title !== undefined) {
          updateMask.push('title');
          payload.title = data.title;
        }
        if (data.description !== undefined) {
          updateMask.push('description');
          payload.description = data.description;
        }
        if (data.maxPoints !== undefined) {
          updateMask.push('maxPoints');
          payload.maxPoints = data.maxPoints;
        }
        if (data.topicId !== undefined) {
          updateMask.push('topicId');
          payload.topicId = data.topicId;
        }
        if (data.dueDate !== undefined) {
          updateMask.push('dueDate');
          payload.dueDate = data.dueDate;
        }

        if (updateMask.length === 0) {
          return;
        }

        await service.updateCourseWork(courseId, courseWorkId, payload as Parameters<typeof service.updateCourseWork>[2], updateMask);
        addToast('Atividade atualizada com sucesso!', 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar atividade';
        addToast(message, 'error');
        throw err;
      }
    },
    [accessToken, addToast]
  );

  /**
   * Convida um professor para multiplas turmas
   */
  const inviteTeacher = useCallback(
    async (
      email: string,
      courseIds: string[]
    ): Promise<{ courseId: string; success: boolean; error?: string }[]> => {
      if (!accessToken) {
        addToast('Token de acesso nao disponivel', 'error');
        throw new Error('Token de acesso nao disponivel');
      }

      const service = createClassroomService(accessToken);
      const results: { courseId: string; success: boolean; error?: string }[] = [];

      for (const courseId of courseIds) {
        try {
          await service.inviteTeacher(courseId, email);
          results.push({ courseId, success: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erro desconhecido';
          results.push({ courseId, success: false, error: message });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      if (errorCount === 0) {
        addToast(`Professor convidado para ${successCount} turma(s)!`, 'success');
      } else if (successCount > 0) {
        addToast(`${successCount} convite(s) enviado(s), ${errorCount} erro(s)`, 'warning');
      } else {
        addToast('Erro ao convidar professor', 'error');
      }

      return results;
    },
    [accessToken, addToast]
  );

  /**
   * Remove um professor de uma turma
   */
  const removeTeacher = useCallback(
    async (courseId: string, userId: string): Promise<void> => {
      if (!accessToken) {
        addToast('Token de acesso nao disponivel', 'error');
        throw new Error('Token de acesso nao disponivel');
      }

      try {
        const service = createClassroomService(accessToken);
        await service.removeTeacher(courseId, userId);
        addToast('Professor removido da turma!', 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao remover professor';
        addToast(message, 'error');
        throw err;
      }
    },
    [accessToken, addToast]
  );

  /**
   * Cancela um convite pendente
   */
  const cancelInvitation = useCallback(
    async (invitationId: string): Promise<void> => {
      if (!accessToken) {
        addToast('Token de acesso nao disponivel', 'error');
        throw new Error('Token de acesso nao disponivel');
      }

      try {
        const service = createClassroomService(accessToken);
        await service.deleteInvitation(invitationId);
        addToast('Convite cancelado com sucesso!', 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao cancelar convite';
        addToast(message, 'error');
        throw err;
      }
    },
    [accessToken, addToast]
  );

  return {
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
  };
}
