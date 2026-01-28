/**
 * Servico de horarios de aula.
 */

import { HorarioAula, DiaSemana } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where } from './base';

const COLLECTION = 'horarios';

export const horarioService = {
  get: (id: string) => getDocument<HorarioAula>(COLLECTION, id),

  getAll: () => getDocuments<HorarioAula>(COLLECTION),

  getByAno: (ano: number) =>
    getDocuments<HorarioAula>(COLLECTION, [
      where('ano', '==', ano),
      where('ativo', '==', true),
    ]),

  getByTurma: (turmaId: string, ano: number) =>
    getDocuments<HorarioAula>(COLLECTION, [
      where('turmaId', '==', turmaId),
      where('ano', '==', ano),
      where('ativo', '==', true),
    ]),

  getByProfessor: async (professorId: string, ano: number): Promise<HorarioAula[]> => {
    // Buscar todos os horários do ano e filtrar client-side
    // (evita problemas de índice composto com array-contains)
    const todosHorarios = await getDocuments<HorarioAula>(COLLECTION, [
      where('ano', '==', ano),
      where('ativo', '==', true),
    ]);

    // Filtrar por professorId OU professorIds (array)
    return todosHorarios.filter(h =>
      h.professorId === professorId ||
      (h.professorIds && h.professorIds.includes(professorId))
    );
  },

  getByProfessorDia: async (professorId: string, ano: number, diaSemana: DiaSemana): Promise<HorarioAula[]> => {
    // Buscar todos os horários do dia e filtrar client-side
    // (evita problemas de índice composto com array-contains)
    const horariosDia = await getDocuments<HorarioAula>(COLLECTION, [
      where('ano', '==', ano),
      where('diaSemana', '==', diaSemana),
      where('ativo', '==', true),
    ]);

    // Filtrar por professorId OU professorIds (array)
    return horariosDia.filter(h =>
      h.professorId === professorId ||
      (h.professorIds && h.professorIds.includes(professorId))
    );
  },

  getByTurmaDia: (turmaId: string, ano: number, diaSemana: DiaSemana) =>
    getDocuments<HorarioAula>(COLLECTION, [
      where('turmaId', '==', turmaId),
      where('ano', '==', ano),
      where('diaSemana', '==', diaSemana),
      where('ativo', '==', true),
    ]),

  // Verifica conflitos antes de criar/atualizar
  checkConflict: async (
    turmaId: string,
    ano: number,
    diaSemana: DiaSemana,
    horaInicio: string,
    horaFim: string,
    excludeId?: string
  ): Promise<HorarioAula | null> => {
    const horarios = await horarioService.getByTurmaDia(turmaId, ano, diaSemana);
    const conflicting = horarios.find(h => {
      if (excludeId && h.id === excludeId) return false;
      // Verifica sobreposicao de horarios
      return (
        (horaInicio >= h.horaInicio && horaInicio < h.horaFim) ||
        (horaFim > h.horaInicio && horaFim <= h.horaFim) ||
        (horaInicio <= h.horaInicio && horaFim >= h.horaFim)
      );
    });
    return conflicting || null;
  },

  // Verifica conflito de professor (mesmo professor em duas turmas ao mesmo tempo)
  checkProfessorConflict: async (
    professorId: string,
    ano: number,
    diaSemana: DiaSemana,
    horaInicio: string,
    horaFim: string,
    excludeId?: string
  ): Promise<HorarioAula | null> => {
    const horarios = await horarioService.getByProfessorDia(professorId, ano, diaSemana);
    const conflicting = horarios.find(h => {
      if (excludeId && h.id === excludeId) return false;
      return (
        (horaInicio >= h.horaInicio && horaInicio < h.horaFim) ||
        (horaFim > h.horaInicio && horaFim <= h.horaFim) ||
        (horaInicio <= h.horaInicio && horaFim >= h.horaFim)
      );
    });
    return conflicting || null;
  },

  create: (data: Omit<HorarioAula, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument(COLLECTION, data),

  update: (id: string, data: Partial<HorarioAula>) =>
    updateDocument(COLLECTION, id, data),

  delete: (id: string) => deleteDocument(COLLECTION, id),

  // Soft delete (desativa o horario)
  deactivate: (id: string) =>
    updateDocument(COLLECTION, id, { ativo: false }),

  // Desativa todos os horarios de um ano
  deactivateByAno: async (ano: number): Promise<number> => {
    const horarios = await horarioService.getByAno(ano);
    let count = 0;
    for (const horario of horarios) {
      await updateDocument(COLLECTION, horario.id, { ativo: false });
      count++;
    }
    return count;
  },
};
