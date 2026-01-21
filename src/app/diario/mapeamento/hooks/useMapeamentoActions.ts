/**
 * Hook para acoes do mapeamento.
 */

import { useCallback, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { mapeamentoSalaService } from '@/services/firestore';
import { Aluno, LayoutSala, Assento } from '@/types';
import { CelulaMapa, DEFAULT_LAYOUT, getIniciais, gerarLayoutInicial } from '../types';

interface UseMapeamentoActionsProps {
  turmaId: string;
  ano: number;
  disciplinaId: string;
  alunos: Aluno[];
  layout: LayoutSala;
  celulas: CelulaMapa[];
  setLayout: (layout: LayoutSala) => void;
  setCelulas: React.Dispatch<React.SetStateAction<CelulaMapa[]>>;
  setIsDirty: (isDirty: boolean) => void;
}

interface UseMapeamentoActionsReturn {
  saving: boolean;
  atualizarLayout: (layout: LayoutSala) => void;
  atualizarCelula: (row: number, col: number, updates: Partial<CelulaMapa>) => void;
  atribuirAluno: (row: number, col: number, alunoId: string | null) => void;
  alternarTipoCelula: (row: number, col: number) => void;
  distribuirAleatorio: () => void;
  limparTodos: () => void;
  salvar: () => Promise<void>;
  resetar: () => void;
}

export function useMapeamentoActions({
  turmaId,
  ano,
  disciplinaId,
  alunos,
  layout,
  celulas,
  setLayout,
  setCelulas,
  setIsDirty,
}: UseMapeamentoActionsProps): UseMapeamentoActionsReturn {
  const { usuario } = useAuthStore();
  const { addToast } = useUIStore();
  const [saving, setSaving] = useState(false);

  const atualizarLayout = useCallback((novoLayout: LayoutSala) => {
    setLayout(novoLayout);
    setCelulas((prevCelulas) => {
      const novasCelulas: CelulaMapa[] = [];
      for (let row = 0; row < novoLayout.rows; row++) {
        for (let col = 0; col < novoLayout.columns; col++) {
          const existente = prevCelulas.find((c) => c.row === row && c.column === col);
          if (existente) {
            novasCelulas.push(existente);
          } else {
            novasCelulas.push({ row, column: col, alunoId: null, tipo: 'mesa' });
          }
        }
      }
      return novasCelulas;
    });
    setIsDirty(true);
  }, [setLayout, setCelulas, setIsDirty]);

  const atualizarCelula = useCallback((row: number, col: number, updates: Partial<CelulaMapa>) => {
    setCelulas((prev) =>
      prev.map((c) => (c.row === row && c.column === col ? { ...c, ...updates } : c))
    );
    setIsDirty(true);
  }, [setCelulas, setIsDirty]);

  const atribuirAluno = useCallback((row: number, col: number, alunoId: string | null) => {
    setCelulas((prev) => {
      const semAluno = prev.map((c) =>
        c.alunoId === alunoId ? { ...c, alunoId: null, aluno: undefined } : c
      );
      return semAluno.map((c) => {
        if (c.row === row && c.column === col) {
          const aluno = alunos.find((a) => a.id === alunoId);
          return {
            ...c,
            alunoId,
            aluno: aluno ? {
              id: aluno.id,
              nome: aluno.nome,
              fotoUrl: aluno.fotoUrl,
              iniciais: getIniciais(aluno.nome),
            } : undefined,
          };
        }
        return c;
      });
    });
    setIsDirty(true);
  }, [alunos, setCelulas, setIsDirty]);

  const alternarTipoCelula = useCallback((row: number, col: number) => {
    setCelulas((prev) =>
      prev.map((c) => {
        if (c.row === row && c.column === col) {
          const tipos: Array<CelulaMapa['tipo']> = ['mesa', 'vazio', 'professor'];
          const idx = tipos.indexOf(c.tipo);
          const novoTipo = tipos[(idx + 1) % tipos.length];
          return {
            ...c,
            tipo: novoTipo,
            alunoId: novoTipo !== 'mesa' ? null : c.alunoId,
            aluno: novoTipo !== 'mesa' ? undefined : c.aluno,
          };
        }
        return c;
      })
    );
    setIsDirty(true);
  }, [setCelulas, setIsDirty]);

  const salvar = useCallback(async () => {
    if (!turmaId || !usuario) return;

    setSaving(true);
    try {
      const assentos: Assento[] = celulas.map((c) => ({
        row: c.row,
        column: c.column,
        alunoId: c.alunoId,
        tipo: c.tipo,
      }));

      await mapeamentoSalaService.save(
        turmaId,
        usuario.id,
        ano,
        layout,
        assentos,
        undefined, // nome
        disciplinaId || undefined // disciplinaId
      );
      setIsDirty(false);
      addToast('Mapeamento salvo com sucesso!', 'success');
    } catch (error) {
      addToast('Erro ao salvar mapeamento', 'error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }, [turmaId, usuario, ano, layout, celulas, disciplinaId, addToast, setIsDirty]);

  const distribuirAleatorio = useCallback(() => {
    // Shuffle alunos array
    const alunosEmbaralhados = [...alunos].sort(() => Math.random() - 0.5);

    setCelulas((prev) => {
      // First, clear all students from cells
      const celulasLimpas = prev.map((c) => ({
        ...c,
        alunoId: null,
        aluno: undefined,
      }));

      // Get available desk cells
      const mesasDisponiveis = celulasLimpas.filter((c) => c.tipo === 'mesa');

      // Assign students to desks randomly
      let alunoIndex = 0;
      return celulasLimpas.map((c) => {
        if (c.tipo === 'mesa' && alunoIndex < alunosEmbaralhados.length) {
          const aluno = alunosEmbaralhados[alunoIndex];
          alunoIndex++;
          return {
            ...c,
            alunoId: aluno.id,
            aluno: {
              id: aluno.id,
              nome: aluno.nome,
              fotoUrl: aluno.fotoUrl,
              iniciais: getIniciais(aluno.nome),
            },
          };
        }
        return c;
      });
    });
    setIsDirty(true);
    addToast(`${Math.min(alunos.length, celulas.filter(c => c.tipo === 'mesa').length)} alunos distribuídos aleatoriamente`, 'success');
  }, [alunos, celulas, setCelulas, setIsDirty, addToast]);

  const limparTodos = useCallback(() => {
    setCelulas((prev) =>
      prev.map((c) => ({
        ...c,
        alunoId: null,
        aluno: undefined,
      }))
    );
    setIsDirty(true);
    addToast('Todos os alunos foram removidos', 'info');
  }, [setCelulas, setIsDirty, addToast]);

  const resetar = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    setCelulas(gerarLayoutInicial(DEFAULT_LAYOUT));
    setIsDirty(true);
  }, [setLayout, setCelulas, setIsDirty]);

  return {
    saving,
    atualizarLayout,
    atualizarCelula,
    atribuirAluno,
    alternarTipoCelula,
    distribuirAleatorio,
    limparTodos,
    salvar,
    resetar,
  };
}
