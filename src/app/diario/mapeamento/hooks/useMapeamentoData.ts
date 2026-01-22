/**
 * Hook principal para dados da pagina de Mapeamento de Sala.
 */

import { useState, useEffect, useMemo } from 'react';
import { useFilterStore } from '@/store/filterStore';
import { AlunoMapa, ModoEdicao, getIniciais, CelulaMapa, DEFAULT_LAYOUT, gerarLayoutInicial } from '../types';
import { UseMapeamentoDataReturn } from './mapeamentoTypes';
import { useMapeamentoLoader } from './useMapeamentoLoader';
import { useMapeamentoActions } from './useMapeamentoActions';

export function useMapeamentoData(): UseMapeamentoDataReturn {
  const { ano, setAno } = useFilterStore();
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
    // Acoes
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
