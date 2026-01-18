/**
 * Hook para gerenciar logica de arvore de disciplinas.
 */

import { useMemo, useCallback } from 'react';
import { Disciplina } from '@/types';
import { DisciplinaNode, MAX_DEPTH } from '../types';

interface UseDisciplinasTreeReturn {
  tree: DisciplinaNode[];
  flatList: DisciplinaNode[];
  getNode: (id: string) => DisciplinaNode | undefined;
  getDescendants: (id: string) => string[];
  getAncestors: (id: string) => string[];
  getAvailableParents: (excludeId?: string) => Disciplina[];
  getFullPath: (id: string) => string;
  getLevel: (id: string) => number;
  canHaveChildren: (id: string) => boolean;
  validateHierarchy: (id: string, newParentId: string | null) => boolean;
}

export function useDisciplinasTree(disciplinas: Disciplina[]): UseDisciplinasTreeReturn {
  // Mapa para acesso rapido
  const disciplinaMap = useMemo(() => {
    const map = new Map<string, Disciplina>();
    disciplinas.forEach(d => map.set(d.id, d));
    return map;
  }, [disciplinas]);

  // Calcula o caminho completo de uma disciplina
  const getFullPath = useCallback((id: string): string => {
    const paths: string[] = [];
    let current = disciplinaMap.get(id);

    while (current) {
      paths.unshift(current.nome);
      current = current.parentId ? disciplinaMap.get(current.parentId) : undefined;
    }

    return paths.join(' > ');
  }, [disciplinaMap]);

  // Calcula o nivel de uma disciplina (0 = raiz)
  const getLevel = useCallback((id: string): number => {
    let level = 0;
    let current = disciplinaMap.get(id);

    while (current?.parentId) {
      level++;
      current = disciplinaMap.get(current.parentId);
    }

    return level;
  }, [disciplinaMap]);

  // Constroi a arvore hierarquica
  const tree = useMemo((): DisciplinaNode[] => {
    const nodeMap = new Map<string, DisciplinaNode>();

    // Primeiro, cria todos os nodes
    disciplinas.forEach(d => {
      nodeMap.set(d.id, {
        ...d,
        children: [],
        level: 0,
        hasChildren: false,
        path: '',
      });
    });

    // Calcula niveis e paths
    nodeMap.forEach((node, id) => {
      node.level = getLevel(id);
      node.path = getFullPath(id);
    });

    // Organiza em arvore
    const roots: DisciplinaNode[] = [];

    nodeMap.forEach(node => {
      if (!node.parentId) {
        roots.push(node);
      } else {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.children.push(node);
          parent.hasChildren = true;
        } else {
          // Pai nao existe, trata como raiz
          roots.push(node);
        }
      }
    });

    // Ordena por ordem em cada nivel
    const sortNodes = (nodes: DisciplinaNode[]): DisciplinaNode[] => {
      return nodes
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
        .map(node => ({
          ...node,
          children: sortNodes(node.children),
        }));
    };

    return sortNodes(roots);
  }, [disciplinas, getLevel, getFullPath]);

  // Lista plana com todos os nodes (para iteracao)
  const flatList = useMemo((): DisciplinaNode[] => {
    const result: DisciplinaNode[] = [];

    const flatten = (nodes: DisciplinaNode[]) => {
      nodes.forEach(node => {
        result.push(node);
        flatten(node.children);
      });
    };

    flatten(tree);
    return result;
  }, [tree]);

  // Busca um node especifico
  const getNode = useCallback((id: string): DisciplinaNode | undefined => {
    return flatList.find(n => n.id === id);
  }, [flatList]);

  // Retorna todos os descendentes de uma disciplina
  const getDescendants = useCallback((id: string): string[] => {
    const result: string[] = [];

    const collect = (node: DisciplinaNode) => {
      node.children.forEach(child => {
        result.push(child.id);
        collect(child);
      });
    };

    const node = getNode(id);
    if (node) {
      collect(node);
    }

    return result;
  }, [getNode]);

  // Retorna todos os ancestrais de uma disciplina
  const getAncestors = useCallback((id: string): string[] => {
    const result: string[] = [];
    let current = disciplinaMap.get(id);

    while (current?.parentId) {
      result.push(current.parentId);
      current = disciplinaMap.get(current.parentId);
    }

    return result;
  }, [disciplinaMap]);

  // Verifica se uma disciplina pode ter filhos (limite de profundidade)
  const canHaveChildren = useCallback((id: string): boolean => {
    return getLevel(id) < MAX_DEPTH - 1;
  }, [getLevel]);

  // Valida se a mudanca de pai nao cria ciclo
  const validateHierarchy = useCallback((id: string, newParentId: string | null): boolean => {
    // Null sempre e valido (vira raiz)
    if (!newParentId) return true;

    // Nao pode ser pai de si mesmo
    if (id === newParentId) return false;

    // Nao pode ser pai de um ancestral (criaria ciclo)
    const descendants = getDescendants(id);
    if (descendants.includes(newParentId)) return false;

    // Verifica limite de profundidade
    const newParentLevel = getLevel(newParentId);
    const maxDescendantDepth = Math.max(0, ...getDescendants(id).map(d => getLevel(d) - getLevel(id)));

    if (newParentLevel + 1 + maxDescendantDepth >= MAX_DEPTH) {
      return false;
    }

    return true;
  }, [getDescendants, getLevel]);

  // Retorna disciplinas disponiveis como pai para uma disciplina
  const getAvailableParents = useCallback((excludeId?: string): Disciplina[] => {
    return disciplinas.filter(d => {
      // Exclui a propria disciplina
      if (excludeId && d.id === excludeId) return false;

      // Exclui descendentes (para evitar ciclo)
      if (excludeId && getDescendants(excludeId).includes(d.id)) return false;

      // Exclui disciplinas no limite de profundidade
      if (!canHaveChildren(d.id)) return false;

      // Apenas disciplinas ativas
      if (!d.ativo) return false;

      return true;
    });
  }, [disciplinas, getDescendants, canHaveChildren]);

  return {
    tree,
    flatList,
    getNode,
    getDescendants,
    getAncestors,
    getAvailableParents,
    getFullPath,
    getLevel,
    canHaveChildren,
    validateHierarchy,
  };
}
