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
  deleteAllHorarios: (ano: number) => Promise<number>;
  importMultipleHorarios: (horarios: Omit<HorarioAula, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<number>;
  sendScheduleToWhatsApp: (
    professor: Usuario,
    horarios: HorarioAula[],
    turmas: Turma[],
    disciplinas: Disciplina[],
    dia?: DiaSemana
  ) => Promise<boolean>;
  sendScheduleToAllProfessors: (
    allHorarios: HorarioAula[],
    professores: Usuario[],
    turmas: Turma[],
    disciplinas: Disciplina[]
  ) => Promise<{ success: number; failed: number }>;
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

  const deleteAllHorarios = useCallback(async (ano: number): Promise<number> => {
    setSaving(true);
    try {
      const count = await horarioService.deactivateByAno(ano);
      addToast(`${count} horarios removidos com sucesso!`, 'success');
      onSuccess?.();
      return count;
    } catch (error) {
      console.error('Erro ao remover horarios:', error);
      addToast('Erro ao remover horarios', 'error');
      return 0;
    } finally {
      setSaving(false);
    }
  }, [addToast, onSuccess]);

  const importMultipleHorarios = useCallback(async (
    horarios: (Omit<HorarioAula, 'id' | 'createdAt' | 'updatedAt'> & { isTrilhas?: boolean })[]
  ): Promise<number> => {
    setSaving(true);
    let successCount = 0;
    let skippedCount = 0;
    let trilhasCount = 0;
    let errorCount = 0;

    try {
      // IMPORTANTE: Ordenar para processar disciplinas normais primeiro, Trilhas por último
      const horariosOrdenados = [...horarios].sort((a, b) => {
        if (a.isTrilhas && !b.isTrilhas) return 1;  // Trilhas vai para o final
        if (!a.isTrilhas && b.isTrilhas) return -1; // Não-Trilhas vem primeiro
        return 0;
      });

      for (const horario of horariosOrdenados) {
        try {
          const { isTrilhas, ...horarioData } = horario;

          if (isTrilhas) {
            // TRILHAS: adicionar apenas para professores que estão LIVRES neste horário
            const professorIds = horarioData.professorIds || [horarioData.professorId];
            const professoresLivres: string[] = [];

            // Verificar quais professores estão livres neste horário
            for (const profId of professorIds) {
              const conflict = await horarioService.checkProfessorConflict(
                profId,
                horarioData.ano,
                horarioData.diaSemana,
                horarioData.horaInicio,
                horarioData.horaFim
              );

              if (!conflict) {
                professoresLivres.push(profId);
              }
            }

            if (professoresLivres.length > 0) {
              // Criar horário apenas com os professores livres
              await horarioService.create({
                ...horarioData,
                professorId: professoresLivres[0],
                professorIds: professoresLivres,
              });
              trilhasCount++;
              successCount++;
            } else {
              // Todos os professores já têm horário neste tempo - pular
              skippedCount++;
            }
          } else {
            // NÃO-TRILHAS: verificar conflitos e pular se houver
            // Verificar conflito de turma antes de importar
            const turmaConflict = await horarioService.checkConflict(
              horarioData.turmaId,
              horarioData.ano,
              horarioData.diaSemana,
              horarioData.horaInicio,
              horarioData.horaFim
            );

            if (turmaConflict) {
              // Pular horario com conflito de turma
              skippedCount++;
              continue;
            }

            // Verificar conflito de professor
            const professorConflict = await horarioService.checkProfessorConflict(
              horarioData.professorId,
              horarioData.ano,
              horarioData.diaSemana,
              horarioData.horaInicio,
              horarioData.horaFim
            );

            if (professorConflict) {
              // Pular horario com conflito de professor
              skippedCount++;
              continue;
            }

            await horarioService.create(horarioData);
            successCount++;
          }
        } catch {
          errorCount++;
        }
      }

      if (successCount > 0) {
        addToast(`${successCount} horarios importados com sucesso!`, 'success');
        onSuccess?.();
      }

      if (trilhasCount > 0) {
        addToast(`${trilhasCount} trilhas atribuídas a professores disponíveis`, 'info');
      }

      if (skippedCount > 0) {
        addToast(`${skippedCount} horarios pulados (conflito ou sem professor livre)`, 'info');
      }

      if (errorCount > 0) {
        addToast(`${errorCount} horarios falharam na importacao`, 'warning');
      }

      return successCount;
    } catch (error) {
      console.error('Erro ao importar horarios:', error);
      addToast('Erro ao importar horarios', 'error');
      return 0;
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

  const sendScheduleToAllProfessors = useCallback(async (
    allHorarios: HorarioAula[],
    professores: Usuario[],
    turmas: Turma[],
    disciplinas: Disciplina[]
  ): Promise<{ success: number; failed: number }> => {
    if (!usuario) {
      addToast('Usuario nao autenticado', 'error');
      return { success: 0, failed: 0 };
    }

    setSending(true);
    let success = 0;
    let failed = 0;

    try {
      // Filtrar professores com celular
      const professoresComCelular = professores.filter(p => p.celular && p.ativo);

      if (professoresComCelular.length === 0) {
        addToast('Nenhum professor com celular cadastrado', 'warning');
        return { success: 0, failed: 0 };
      }

      for (const professor of professoresComCelular) {
        // Filtrar horarios do professor
        const horariosProf = allHorarios.filter(h =>
          h.professorId === professor.id ||
          (h.professorIds && h.professorIds.includes(professor.id))
        );

        if (horariosProf.length === 0) {
          continue; // Pular professores sem horarios
        }

        // Formatar mensagem
        const mensagem = formatWeeklySchedule({
          professorName: professor.nome,
          horarios: horariosProf,
          turmas,
          disciplinas,
          senderName: usuario.nome,
          senderEmail: usuario.email,
        });

        try {
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
          if (result.success) {
            success++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      addToast(`Horarios enviados: ${success} sucesso, ${failed} falhas`, success > 0 ? 'success' : 'error');
      return { success, failed };
    } catch (error) {
      console.error('Erro ao enviar WhatsApp para todos:', error);
      addToast('Erro ao enviar mensagens', 'error');
      return { success, failed };
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
    deleteAllHorarios,
    importMultipleHorarios,
    sendScheduleToWhatsApp,
    sendScheduleToAllProfessors,
  };
}
