/**
 * Hook principal para dados da pagina de Mapeamento de Sala.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFilterStore } from '@/store/filterStore';
import { useUIStore } from '@/store/uiStore';
import { turmaService } from '@/services/firestore';
import { LayoutSala } from '@/types';
import { AlunoMapa, ModoEdicao, getIniciais, CelulaMapa, DEFAULT_LAYOUT, gerarLayoutInicial } from '../types';
import { UseMapeamentoDataReturn } from './mapeamentoTypes';
import { useMapeamentoLoader } from './useMapeamentoLoader';
import { useMapeamentoActions } from './useMapeamentoActions';

export function useMapeamentoData(): UseMapeamentoDataReturn {
  const { ano, setAno } = useFilterStore();
  const { addToast } = useUIStore();
  const [turmaId, setTurmaId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [modoEdicao, setModoEdicao] = useState<ModoEdicao>('selecionar');
  const [professorIdVisualizando, setProfessorIdVisualizando] = useState<string | null>(null);

  const {
    turmas,
    disciplinas,
    alunos,
    loadingTurmas,
    loadingDisciplinas,
    loadingAlunos,
    loadingMapeamento,
    layout,
    celulas,
    setLayout,
    setCelulas,
    isDirty,
    setIsDirty,
    mapeamentosDaTurma,
    conselheiroId,
    turmaSelecionada,
    layoutConfigurado,
  } = useMapeamentoLoader(ano, turmaId, disciplinaId);

  // Quando a turma muda, limpar visualização
  useEffect(() => {
    setProfessorIdVisualizando(null);
  }, [turmaId]);

  // Calcular layout e celulas para visualização (quando está vendo mapeamento de outro professor)
  const layoutVisualizacao = useMemo(() => {
    if (!professorIdVisualizando) return layout;
    const mapeamento = mapeamentosDaTurma.find(m => m.professorId === professorIdVisualizando);
    return mapeamento?.layout || DEFAULT_LAYOUT;
  }, [professorIdVisualizando, mapeamentosDaTurma, layout]);

  const celulasVisualizacao = useMemo((): CelulaMapa[] => {
    if (!professorIdVisualizando) return celulas;
    const mapeamento = mapeamentosDaTurma.find(m => m.professorId === professorIdVisualizando);
    if (!mapeamento) return gerarLayoutInicial(DEFAULT_LAYOUT);

    return mapeamento.assentos.map((assento) => {
      const aluno = alunos.find((a) => a.id === assento.alunoId);
      return {
        ...assento,
        aluno: aluno ? {
          id: aluno.id,
          nome: aluno.nome,
          fotoUrl: aluno.fotoUrl,
          iniciais: getIniciais(aluno.nome),
        } : undefined,
      };
    });
  }, [professorIdVisualizando, mapeamentosDaTurma, alunos, celulas]);

  const {
    saving,
    atualizarLayout,
    atualizarCelula,
    atribuirAluno,
    alternarTipoCelula,
    distribuirAleatorio,
    limparTodos,
    salvar,
    resetar,
    excluirMapeamento,
  } = useMapeamentoActions({
    turmaId,
    ano,
    disciplinaId,
    alunos,
    layout,
    celulas,
    setLayout,
    setCelulas,
    setIsDirty,
  });

  // Alunos disponiveis (nao atribuidos a nenhuma celula)
  const alunosDisponiveis: AlunoMapa[] = alunos
    .filter((aluno) => !celulas.some((c) => c.alunoId === aluno.id))
    .map((aluno) => ({
      id: aluno.id,
      nome: aluno.nome,
      fotoUrl: aluno.fotoUrl,
      iniciais: getIniciais(aluno.nome),
    }));

  // Salvar layout padrao da turma
  const salvarLayoutPadrao = useCallback(async (novoLayout: LayoutSala) => {
    if (!turmaId) return;
    try {
      await turmaService.update(turmaId, {
        layoutPadrao: novoLayout,
        layoutConfigurado: true,
      });
      addToast('Layout padrao da turma salvo com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar layout padrao:', error);
      addToast('Erro ao salvar layout padrao', 'error');
    }
  }, [turmaId, addToast]);

  // Alternar visibilidade da configuracao de layout
  const toggleLayoutConfigurado = useCallback(async () => {
    if (!turmaId || !turmaSelecionada) return;
    try {
      await turmaService.update(turmaId, {
        layoutConfigurado: !turmaSelecionada.layoutConfigurado,
      });
      addToast(
        turmaSelecionada.layoutConfigurado
          ? 'Configuracao de layout reaberta'
          : 'Configuracao de layout bloqueada',
        'success'
      );
    } catch (error) {
      console.error('Erro ao alterar configuracao:', error);
      addToast('Erro ao alterar configuracao', 'error');
    }
  }, [turmaId, turmaSelecionada, addToast]);

  return {
    turmas,
    disciplinas,
    alunos,
    alunosDisponiveis,
    loadingTurmas,
    loadingDisciplinas,
    loadingAlunos,
    loadingMapeamento,
    saving,
    ano,
    turmaId,
    disciplinaId,
    setAno,
    setTurmaId,
    setDisciplinaId,
    layout: professorIdVisualizando ? layoutVisualizacao : layout,
    celulas: professorIdVisualizando ? celulasVisualizacao : celulas,
    isDirty,
    modoEdicao,
    setModoEdicao,
    // Novos campos para visualização
    mapeamentosDaTurma,
    professorIdVisualizando,
    setProfessorIdVisualizando,
    conselheiroId,
    // Configuracao de layout da turma
    turmaSelecionada,
    layoutConfigurado,
    salvarLayoutPadrao,
    toggleLayoutConfigurado,
    // Acoes
    atualizarLayout,
    atualizarCelula,
    atribuirAluno,
    alternarTipoCelula,
    distribuirAleatorio,
    limparTodos,
    salvar,
    resetar,
    excluirMapeamento,
  };
}
