/**
 * Hook para gerenciamento de composicao de notas.
 */

import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { notaService } from '@/services/firestore';
import { NotaComposicao } from '@/types';
import { NotasAluno, ModoCell, parseCellKey } from '../types';

interface ComponenteFormula {
  nome: string;
  notaMaxima: number;
  nota: number | null;
}

interface FormulaDetalhada {
  componentes: ComponenteFormula[];
  todasPreenchidas: boolean;
  somaMaximas: number;
  somaNotas: number | null;
}

interface UseNotasCompositionParams {
  serieId: string;
  disciplinaId: string;
  bimestre: number;
  ano: number;
  notas: Record<string, NotasAluno>;
  setNotas: React.Dispatch<React.SetStateAction<Record<string, NotasAluno>>>;
  modosCells: Record<string, ModoCell>;
  setModosCells: React.Dispatch<React.SetStateAction<Record<string, ModoCell>>>;
  getTemplate: (av: 'av1' | 'av2') => NotaComposicao[];
}

interface UseNotasCompositionReturn {
  notasModalOpen: boolean;
  editingCellKey: string | null;
  subNotas: NotaComposicao[];
  savingComposicao: boolean;
  openCompositionModal: (cellKey: string) => void;
  closeCompositionModal: () => void;
  handleSubNotaValorChange: (id: string, value: string) => void;
  getTotalValoresMax: () => number;
  calcularNotaComposicao: () => number | null;
  gerarFormulaDetalhada: () => FormulaDetalhada | null;
  handleSaveNotasComposicao: () => Promise<void>;
}

export function useNotasComposition({
  serieId,
  disciplinaId,
  bimestre,
  ano,
  notas,
  setNotas,
  modosCells,
  setModosCells,
  getTemplate,
}: UseNotasCompositionParams): UseNotasCompositionReturn {
  const { addToast } = useUIStore();
  const { usuario } = useAuth();

  const [notasModalOpen, setNotasModalOpen] = useState(false);
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [subNotas, setSubNotas] = useState<NotaComposicao[]>([]);
  const [savingComposicao, setSavingComposicao] = useState(false);

  const openCompositionModal = useCallback((cellKey: string) => {
    const { alunoId, av } = parseCellKey(cellKey);
    setEditingCellKey(cellKey);

    // Sempre usar o template atual
    const template = getTemplate(av);

    // Verificar se ja existe composicao salva para restaurar valores
    const alunoNotas = notas[alunoId];
    const composicaoSalva = av === 'av1' ? alunoNotas?.av1Composicao : alunoNotas?.av2Composicao;
    const existingModo = modosCells[cellKey];
    const composicaoExistente = composicaoSalva || existingModo?.composicao;

    // Usar estrutura do template, mas tentar restaurar valores existentes por nome
    const novasSubNotas = template.map(t => {
      const componenteExistente = composicaoExistente?.find(c => c.nome === t.nome);
      return {
        ...t,
        valor: componenteExistente?.valor ?? null,
      };
    });

    setSubNotas(novasSubNotas);
    setNotasModalOpen(true);
  }, [notas, modosCells, getTemplate]);

  const closeCompositionModal = useCallback(() => {
    setNotasModalOpen(false);
    setEditingCellKey(null);
  }, []);

  const handleSubNotaValorChange = useCallback((id: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value.replace(',', '.'));

    setSubNotas(prev => {
      const componente = prev.find(s => s.id === id);
      const notaMaxima = componente?.porcentagem || 10;

      if (numValue !== null && numValue < 0) {
        addToast('A nota não pode ser negativa', 'warning');
        return prev;
      }

      if (numValue !== null && numValue > notaMaxima) {
        addToast(`${componente?.nome}: nota máxima é ${notaMaxima}`, 'warning');
        return prev;
      }

      return prev.map(s => s.id === id ? { ...s, valor: numValue } : s);
    });
  }, [addToast]);

  const getTotalValoresMax = useCallback((): number => {
    return subNotas.reduce((acc, s) => acc + s.porcentagem, 0);
  }, [subNotas]);

  const calcularNotaComposicao = useCallback((): number | null => {
    if (subNotas.length === 0) return null;

    let somaNotas = 0;
    for (const sub of subNotas) {
      if (sub.valor === null) return null;
      somaNotas += sub.valor;
    }
    return Math.round(somaNotas * 10) / 10;
  }, [subNotas]);

  const gerarFormulaDetalhada = useCallback((): FormulaDetalhada | null => {
    if (subNotas.length === 0) return null;

    const componentes: ComponenteFormula[] = subNotas.map(sub => ({
      nome: sub.nome,
      notaMaxima: sub.porcentagem,
      nota: sub.valor,
    }));

    const todasPreenchidas = componentes.every(c => c.nota !== null);
    const somaMaximas = componentes.reduce((acc, c) => acc + c.notaMaxima, 0);
    const somaNotas = todasPreenchidas
      ? Math.round(componentes.reduce((acc, c) => acc + (c.nota || 0), 0) * 10) / 10
      : null;

    return { componentes, todasPreenchidas, somaMaximas, somaNotas };
  }, [subNotas]);

  const handleSaveNotasComposicao = useCallback(async () => {
    if (subNotas.length === 0) {
      addToast('Adicione componentes na composição primeiro', 'error');
      return;
    }

    const notaCalculada = calcularNotaComposicao();
    if (notaCalculada === null) {
      addToast('Preencha todas as notas dos componentes', 'error');
      return;
    }

    if (!editingCellKey || !serieId || !disciplinaId || !usuario) {
      addToast('Erro: dados incompletos', 'error');
      return;
    }

    const { alunoId, av } = parseCellKey(editingCellKey);
    const tipo = av === 'av1' ? 'AV1' : 'AV2';
    const notaIdKey = av === 'av1' ? 'av1Id' : 'av2Id';
    const composicaoKey = av === 'av1' ? 'av1Composicao' : 'av2Composicao';
    const existingNotaId = notas[alunoId]?.[notaIdKey];

    setSavingComposicao(true);
    try {
      const notaData: Record<string, unknown> = {
        alunoId,
        turmaId: serieId,
        disciplinaId,
        professorId: usuario.id,
        bimestre: bimestre as 1 | 2 | 3 | 4,
        tipo,
        valor: notaCalculada,
        ano,
        composicao: subNotas,
      };

      let notaId = existingNotaId;

      if (existingNotaId) {
        await notaService.update(existingNotaId, notaData);
      } else {
        notaId = await notaService.create(notaData as Parameters<typeof notaService.create>[0]);
      }

      // Atualizar estado local
      setModosCells(prev => ({
        ...prev,
        [editingCellKey]: {
          modo: 'composicao',
          composicao: subNotas,
        },
      }));

      setNotas(prev => ({
        ...prev,
        [alunoId]: {
          ...prev[alunoId],
          [av]: notaCalculada,
          [notaIdKey]: notaId,
          [composicaoKey]: subNotas,
        },
      }));

      addToast(`Nota ${notaCalculada} salva com sucesso!`, 'success');
      closeCompositionModal();
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      addToast('Erro ao salvar nota no banco de dados', 'error');
    } finally {
      setSavingComposicao(false);
    }
  }, [
    subNotas,
    calcularNotaComposicao,
    editingCellKey,
    serieId,
    disciplinaId,
    usuario,
    bimestre,
    ano,
    notas,
    setNotas,
    setModosCells,
    addToast,
    closeCompositionModal,
  ]);

  return {
    notasModalOpen,
    editingCellKey,
    subNotas,
    savingComposicao,
    openCompositionModal,
    closeCompositionModal,
    handleSubNotaValorChange,
    getTotalValoresMax,
    calcularNotaComposicao,
    gerarFormulaDetalhada,
    handleSaveNotasComposicao,
  };
}
