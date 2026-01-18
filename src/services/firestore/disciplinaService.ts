/**
 * Servico de disciplinas com suporte a hierarquia.
 */

import { Disciplina } from '@/types';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument, where, orderBy } from './base';

const COLLECTION = 'disciplinas';

export const disciplinaService = {
  // CRUD basico
  get: (id: string) => getDocument<Disciplina>(COLLECTION, id),
  getAll: () => getDocuments<Disciplina>(COLLECTION, [orderBy('ordem'), orderBy('nome')]),
  getAtivas: () => getDocuments<Disciplina>(COLLECTION, [where('ativo', '==', true), orderBy('ordem'), orderBy('nome')]),
  create: (data: Omit<Disciplina, 'id' | 'createdAt' | 'updatedAt'>) => createDocument(COLLECTION, data),
  update: (id: string, data: Partial<Disciplina>) => updateDocument(COLLECTION, id, data),
  delete: (id: string) => deleteDocument(COLLECTION, id),

  // Metodos hierarquicos
  getRoots: () => getDocuments<Disciplina>(COLLECTION, [
    where('parentId', '==', null),
    where('ativo', '==', true),
    orderBy('ordem'),
  ]),

  getByParentId: (parentId: string | null) => getDocuments<Disciplina>(COLLECTION, [
    where('parentId', '==', parentId),
    where('ativo', '==', true),
    orderBy('ordem'),
  ]),

  getChildren: (parentId: string) => getDocuments<Disciplina>(COLLECTION, [
    where('parentId', '==', parentId),
    where('ativo', '==', true),
    orderBy('ordem'),
  ]),

  // Atualiza pai de uma disciplina
  updateParent: async (id: string, newParentId: string | null) => {
    return updateDocument(COLLECTION, id, { parentId: newParentId });
  },

  // Move filhos para raiz (quando pai e excluido)
  moveChildrenToRoot: async (parentId: string) => {
    const children = await disciplinaService.getChildren(parentId);
    await Promise.all(
      children.map(child => updateDocument(COLLECTION, child.id, { parentId: null }))
    );
  },

  // Desativa disciplina e todos os filhos recursivamente
  deactivateWithChildren: async (id: string) => {
    const toDeactivate = [id];
    const visited = new Set<string>();

    // BFS para encontrar todos os descendentes
    while (toDeactivate.length > 0) {
      const currentId = toDeactivate.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const children = await disciplinaService.getChildren(currentId);
      children.forEach(child => toDeactivate.push(child.id));
    }

    // Desativa todos
    await Promise.all(
      Array.from(visited).map(disciplinaId =>
        updateDocument(COLLECTION, disciplinaId, { ativo: false })
      )
    );

    return Array.from(visited);
  },

  // Busca proxima ordem disponivel em um nivel
  getNextOrder: async (parentId: string | null): Promise<number> => {
    const siblings = await disciplinaService.getByParentId(parentId);
    if (siblings.length === 0) return 1;
    return Math.max(...siblings.map(s => s.ordem || 0)) + 1;
  },

  // Retorna apenas disciplinas selecionaveis (nao grupos)
  getSelectable: async (): Promise<Disciplina[]> => {
    const todas = await disciplinaService.getAtivas();
    return todas.filter(d => d.isGroup !== true);
  },

  // Retorna disciplinas selecionaveis por turma
  getSelectableByTurma: async (turmaId: string): Promise<Disciplina[]> => {
    const todas = await disciplinaService.getAtivas();
    return todas.filter(d => d.isGroup !== true && d.turmaIds?.includes(turmaId));
  },

  // Retorna estrutura agrupada para selects
  getGroupedForSelect: async (): Promise<{
    grupos: Disciplina[];
    disciplinas: Disciplina[];
    byParent: Map<string | null, Disciplina[]>;
  }> => {
    const todas = await disciplinaService.getAtivas();
    const grupos = todas.filter(d => d.isGroup === true);
    const disciplinas = todas.filter(d => d.isGroup !== true);

    const byParent = new Map<string | null, Disciplina[]>();
    disciplinas.forEach(d => {
      const parentId = d.parentId || null;
      if (!byParent.has(parentId)) {
        byParent.set(parentId, []);
      }
      byParent.get(parentId)!.push(d);
    });

    return { grupos, disciplinas, byParent };
  },
};
