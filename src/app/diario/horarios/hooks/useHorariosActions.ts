'use client';

/**
 * Hook para acoes de horarios (CRUD + WhatsApp).
 */

import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { horarioService } from '@/services/firestore';
import { HorarioAula, DiaSemana, Usuario, Turma, Disciplina } from '@/types';
import { formatWeeklySchedule } from '../utils';

interface UseHorariosActionsReturn {
  saving: boolean;
  sending: boolean;
  createHorario: (data: Omit<HorarioAula, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateHorario: (id: string, data: Partial<HorarioAula>) => Promise<boolean>;
  deleteHorario: (id: string) => Promise<boolean>;
  sendScheduleToWhatsApp: (
    professor: Usuario,
    horarios: HorarioAula[],
    turmas: Turma[],
    disciplinas: Disciplina[],
    dia?: DiaSemana
  ) => Promise<boolean>;
}

export function useHorariosActions(onSuccess?: () => void): UseHorariosActionsReturn {
  const { addToast } = useUIStore();
  const { usuario } = useAuth();
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const createHorario = useCallback(async (
    data: Omit<HorarioAula, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string | null> => {
    setSaving(true);
    try {
      // Verificar conflito de turma
      const turmaConflict = await horarioService.checkConflict(
        data.turmaId,
        data.ano,
        data.diaSemana,
        data.horaInicio,
        data.horaFim
      );
      if (turmaConflict) {
        addToast('Conflito de horario: ja existe aula neste slot para esta turma', 'error');
        return null;
      }

      // Verificar conflito de professor
      const professorConflict = await horarioService.checkProfessorConflict(
        data.professorId,
        data.ano,
        data.diaSemana,
        data.horaInicio,
        data.horaFim
      );
      if (professorConflict) {
        addToast('Conflito de horario: professor ja tem aula neste horario', 'error');
        return null;
      }

      const id = await horarioService.create(data);
      addToast('Horario criado com sucesso!', 'success');
      onSuccess?.();
      return id;
    } catch (error) {
      console.error('Erro ao criar horario:', error);
      addToast('Erro ao criar horario', 'error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [addToast, onSuccess]);

  const updateHorario = useCallback(async (
    id: string,
    data: Partial<HorarioAula>
  ): Promise<boolean> => {
    setSaving(true);
    try {
      // Se estiver mudando horario, verificar conflitos
      if (data.horaInicio || data.horaFim || data.diaSemana !== undefined) {
        const current = await horarioService.get(id);
        if (current) {
          const turmaConflict = await horarioService.checkConflict(
            data.turmaId || current.turmaId,
            data.ano || current.ano,
            data.diaSemana !== undefined ? data.diaSemana : current.diaSemana,
            data.horaInicio || current.horaInicio,
            data.horaFim || current.horaFim,
            id
          );
          if (turmaConflict) {
            addToast('Conflito de horario: ja existe aula neste slot', 'error');
            return false;
          }

          const professorConflict = await horarioService.checkProfessorConflict(
            data.professorId || current.professorId,
            data.ano || current.ano,
            data.diaSemana !== undefined ? data.diaSemana : current.diaSemana,
            data.horaInicio || current.horaInicio,
            data.horaFim || current.horaFim,
            id
          );
          if (professorConflict) {
            addToast('Conflito de horario: professor ja tem aula neste horario', 'error');
            return false;
          }
        }
      }

      await horarioService.update(id, data);
      addToast('Horario atualizado com sucesso!', 'success');
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar horario:', error);
      addToast('Erro ao atualizar horario', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [addToast, onSuccess]);

  const deleteHorario = useCallback(async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      await horarioService.deactivate(id);
      addToast('Horario removido com sucesso!', 'success');
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Erro ao remover horario:', error);
      addToast('Erro ao remover horario', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [addToast, onSuccess]);

  const sendScheduleToWhatsApp = useCallback(async (
    professor: Usuario,
    horarios: HorarioAula[],
    turmas: Turma[],
    disciplinas: Disciplina[],
    dia?: DiaSemana
  ): Promise<boolean> => {
    if (!professor.celular) {
      addToast('Professor nao possui celular cadastrado', 'error');
      return false;
    }

    if (!usuario) {
      addToast('Usuario nao autenticado', 'error');
      return false;
    }

    setSending(true);
    try {
      // Filtrar horarios por dia se especificado
      const horariosToSend = dia !== undefined
        ? horarios.filter(h => h.diaSemana === dia)
        : horarios;

      if (horariosToSend.length === 0) {
        addToast('Nenhum horario para enviar', 'warning');
        return false;
      }

      // Formatar mensagem elegante
      const mensagem = formatWeeklySchedule({
        professorName: professor.nome,
        horarios: horariosToSend,
        turmas,
        disciplinas,
        dia,
        senderName: usuario.nome,
        senderEmail: usuario.email,
      });

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarioId: professor.id,
          destinatarioNome: professor.nome,
          numero: professor.celular,
          mensagem,
          enviadoPorId: usuario.id,
          enviadoPorNome: usuario.nome,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        addToast(result.error || 'Erro ao enviar mensagem', 'error');
        return false;
      }

      addToast('Horario enviado via WhatsApp!', 'success');
      return true;
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      addToast('Erro ao enviar mensagem', 'error');
      return false;
    } finally {
      setSending(false);
    }
  }, [addToast, usuario]);

  return {
    saving,
    sending,
    createHorario,
    updateHorario,
    deleteHorario,
    sendScheduleToWhatsApp,
  };
}
