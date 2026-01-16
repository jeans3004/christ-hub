/**
 * Hook para gerenciamento de composicao de notas.
 * Calcula notas automaticamente baseado nas avaliacoes de rubricas.
 */

import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { notaService } from '@/services/firestore';
import { NotaComposicao, AvaliacaoRubrica, NivelRubrica } from '@/types';
import { NotasAluno, ModoCell, parseCellKey } from '../types';

// Mapeamento de nivel para porcentagem
const NIVEL_PERCENTUAL: Record<NivelRubrica, number> = {
  A: 1.0,    // 100%
  B: 0.8,    // 80%
  C: 0.6,    // 60%
  D: 0.4,    // 40%
  E: 0.2,    // 20%
};

interface RubricaDetalhe {
  rubricaId: string;
  rubricaNome: string;
  nivel: NivelRubrica | null;
  valorMaximo: number;
  valorCalculado: number | null;
}

interface ComponenteFormula {
  nome: string;
  notaMaxima: number;
  nota: number | null;
  rubricas: RubricaDetalhe[];
  todasRubricasAvaliadas: boolean;
}

interface FormulaDetalhada {
  componentes: ComponenteFormula[];
  todasPreenchidas: boolean;
  somaMaximas: number;
  somaNotas: number | null;
}

interface RubricaInfo {
  id: string;
  nome: string;
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
  avaliacoes: AvaliacaoRubrica[];
  rubricas: RubricaInfo[];
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
  avaliacoes,
  rubricas,
}: UseNotasCompositionParams): UseNotasCompositionReturn {
  const { addToast } = useUIStore();
  const { usuario } = useAuth();

  const [notasModalOpen, setNotasModalOpen] = useState(false);
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [subNotas, setSubNotas] = useState<NotaComposicao[]>([]);
  const [savingComposicao, setSavingComposicao] = useState(false);

  // Funcao auxiliar para obter avaliacao de um aluno em uma rubrica para um componente específico
  const getAvaliacaoAluno = useCallback((alunoId: string, rubricaId: string, componenteId: string): NivelRubrica | null => {
    const avaliacao = avaliacoes.find(
      a => a.alunoId === alunoId && a.rubricaId === rubricaId && a.componenteId === componenteId
    );
    return avaliacao?.nivel || null;
  }, [avaliacoes]);

  // Funcao auxiliar para obter nome da rubrica
  const getRubricaNome = useCallback((rubricaId: string): string => {
    return rubricas.find(r => r.id === rubricaId)?.nome || 'Rubrica';
  }, [rubricas]);

  // Calcular valor de um componente baseado nas avaliacoes de rubricas
  const calcularValorComponente = useCallback((
    componente: NotaComposicao,
    alunoId: string
  ): { valor: number | null; detalhes: RubricaDetalhe[] } => {
    const rubricaIds = componente.rubricaIds || [];

    if (rubricaIds.length === 0) {
      // Sem rubricas selecionadas - valor nulo
      return { valor: null, detalhes: [] };
    }

    const valorPorRubrica = componente.porcentagem / componente.quantidadeRubricas;
    let somaValores = 0;
    let todasAvaliadas = true;
    const detalhes: RubricaDetalhe[] = [];

    for (const rubricaId of rubricaIds) {
      const nivel = getAvaliacaoAluno(alunoId, rubricaId, componente.id);
      const rubricaNome = getRubricaNome(rubricaId);

      if (nivel === null) {
        todasAvaliadas = false;
        detalhes.push({
          rubricaId,
          rubricaNome,
          nivel: null,
          valorMaximo: valorPorRubrica,
          valorCalculado: null,
        });
      } else {
        const valorCalculado = Math.round(valorPorRubrica * NIVEL_PERCENTUAL[nivel] * 100) / 100;
        somaValores += valorCalculado;
        detalhes.push({
          rubricaId,
          rubricaNome,
          nivel,
          valorMaximo: valorPorRubrica,
          valorCalculado,
        });
      }
    }

    return {
      valor: todasAvaliadas ? Math.round(somaValores * 100) / 100 : null,
      detalhes,
    };
  }, [getAvaliacaoAluno, getRubricaNome]);

  const openCompositionModal = useCallback((cellKey: string) => {
    const { alunoId, av } = parseCellKey(cellKey);
    setEditingCellKey(cellKey);

    // Sempre usar o template atual
    const template = getTemplate(av);

    // Calcular valores automaticamente baseado nas avaliacoes de rubricas
    const novasSubNotas = template.map(t => {
      const { valor } = calcularValorComponente(t, alunoId);
      return {
        ...t,
        valor,
      };
    });

    setSubNotas(novasSubNotas);
    setNotasModalOpen(true);
  }, [getTemplate, calcularValorComponente]);

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
    if (subNotas.length === 0 || !editingCellKey) return null;

    const { alunoId } = parseCellKey(editingCellKey);

    const componentes: ComponenteFormula[] = subNotas.map(sub => {
      const { detalhes } = calcularValorComponente(sub, alunoId);
      const todasRubricasAvaliadas = detalhes.length > 0 && detalhes.every(d => d.nivel !== null);
      return {
        nome: sub.nome,
        notaMaxima: sub.porcentagem,
        nota: sub.valor,
        rubricas: detalhes,
        todasRubricasAvaliadas,
      };
    });

    const todasPreenchidas = componentes.every(c => c.nota !== null);
    const somaMaximas = componentes.reduce((acc, c) => acc + c.notaMaxima, 0);
    const somaNotas = todasPreenchidas
      ? Math.round(componentes.reduce((acc, c) => acc + (c.nota || 0), 0) * 10) / 10
      : null;

    return { componentes, todasPreenchidas, somaMaximas, somaNotas };
  }, [subNotas, editingCellKey, calcularValorComponente]);

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
