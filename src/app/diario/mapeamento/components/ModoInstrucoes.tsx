'use client';

/**
 * Instrucoes do modo de edicao atual.
 */

import { Typography } from '@mui/material';
import { ModoEdicao } from '../types';

interface ModoInstrucoesProps {
  modoEdicao: ModoEdicao;
}

const INSTRUCOES: Record<ModoEdicao, string> = {
  visualizar: 'Modo visualizacao - selecione um modo de edicao',
  selecionar: 'Arraste um aluno da lista para uma mesa',
  editar_tipo: 'Clique em uma celula para alterar o tipo (mesa/vazio/professor)',
  remover: 'Clique em uma mesa ocupada para remover o aluno',
  atribuir: 'Arraste um aluno da lista para uma mesa',
  remover_aluno: 'Clique em uma mesa ocupada para remover o aluno',
};

export function ModoInstrucoes({ modoEdicao }: ModoInstrucoesProps) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      {INSTRUCOES[modoEdicao] || ''}
    </Typography>
  );
}
