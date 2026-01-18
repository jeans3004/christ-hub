/**
 * Hook principal para dados da pagina de Mapeamento de Sala.
 */

import { useState } from 'react';
import { useFilterStore } from '@/store/filterStore';
import { AlunoMapa, ModoEdicao, getIniciais } from '../types';
import { UseMapeamentoDataReturn } from './mapeamentoTypes';
import { useMapeamentoLoader } from './useMapeamentoLoader';
import { useMapeamentoActions } from './useMapeamentoActions';

export function useMapeamentoData(): UseMapeamentoDataReturn {
  const { ano, setAno } = useFilterStore();
  const [turmaId, setTurmaId] = useState('');
  const [modoEdicao, setModoEdicao] = useState<ModoEdicao>('selecionar');

  const {
    turmas,
    alunos,
    loadingTurmas,
    loadingAlunos,
    loadingMapeamento,
    layout,
    celulas,
    setLayout,
    setCelulas,
    isDirty,
    setIsDirty,
  } = useMapeamentoLoader(ano, turmaId);

  const {
    saving,
    atualizarLayout,
    atualizarCelula,
    atribuirAluno,
    alternarTipoCelula,
    salvar,
    resetar,
  } = useMapeamentoActions({
    turmaId,
    ano,
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
    alunos,
    alunosDisponiveis,
    loadingTurmas,
    loadingAlunos,
    loadingMapeamento,
    saving,
    ano,
    turmaId,
    setAno,
    setTurmaId,
    layout,
    celulas,
    isDirty,
    modoEdicao,
    setModoEdicao,
    atualizarLayout,
    atualizarCelula,
    atribuirAluno,
    alternarTipoCelula,
    salvar,
    resetar,
  };
}
