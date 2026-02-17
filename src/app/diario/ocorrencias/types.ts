/**
 * Tipos e constantes para o modulo de ocorrencias.
 */

import React from 'react';
import { Ocorrencia } from '@/types';

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export interface OcorrenciaColumn {
  id: string;
  label: string;
  minWidth: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: Ocorrencia) => React.ReactNode;
}

// Colunas base para pendentes
export const COLUMNS_PENDENTES: OcorrenciaColumn[] = [
  { id: 'alunoNome', label: 'Aluno', minWidth: 150 },
  { id: 'serie', label: 'Série', minWidth: 100 },
  { id: 'motivo', label: 'Motivo', minWidth: 200 },
  { id: 'usuarioNome', label: 'Usuário', minWidth: 120 },
  {
    id: 'data',
    label: 'Data',
    minWidth: 100,
    format: (value: any) => new Date(value).toLocaleDateString('pt-BR'),
  },
  {
    id: 'sgeSyncedAt',
    label: 'SGE',
    minWidth: 60,
    align: 'center',
    format: (_value: any, row: Ocorrencia) => {
      if (row.sgeSyncError) return 'SGE ✗';
      if (row.sgeSyncedAt) return 'SGE ✓';
      return '—';
    },
  },
];

// Colunas adicionais para aprovadas
export const COLUMNS_APROVADAS: OcorrenciaColumn[] = [
  ...COLUMNS_PENDENTES,
  { id: 'aprovadaPor', label: 'Aprovada por', minWidth: 100 },
  {
    id: 'aprovadaEm',
    label: 'Data Aprovação',
    minWidth: 100,
    format: (value: any) => value ? new Date(value).toLocaleDateString('pt-BR') : '-',
  },
];

// Colunas para historico
export const COLUMNS_HISTORICO: OcorrenciaColumn[] = [
  { id: 'nome', label: 'Nome', minWidth: 150 },
  { id: 'serie', label: 'Série', minWidth: 100 },
  { id: 'turma', label: 'Turma', minWidth: 80 },
  { id: 'turno', label: 'Turno', minWidth: 80 },
];

// Mock data (sera substituido por Firebase)
export const MOCK_PENDENTES: Ocorrencia[] = [
  {
    id: '1',
    alunoId: '1',
    alunoNome: 'Lucas Felipe Martins da Costa',
    turmaId: '1',
    serie: '7º ano - Ensino Fundamental II',
    motivo: 'Não veio 5 dias da licença a permanente atte do CM de para correção',
    descricao: '',
    usuarioId: '1',
    usuarioNome: 'WILEKA CARDOSO DOS SANTOS SOUSA',
    data: new Date('2025-01-14'),
    status: 'pendente',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    alunoId: '2',
    alunoNome: 'Maria Clara dos Reis',
    turmaId: '1',
    serie: '7º ano - Ensino Fundamental II',
    motivo: 'Aluno com 3 faltas consecutivas sem justificativa',
    descricao: '',
    usuarioId: '1',
    usuarioNome: 'WILEKA CARDOSO DOS SANTOS SOUSA',
    data: new Date('2025-01-13'),
    status: 'pendente',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const MOCK_APROVADAS: Ocorrencia[] = [
  {
    id: '3',
    alunoId: '3',
    alunoNome: 'Pedro Henrique Silva',
    turmaId: '1',
    serie: '8º ano - Ensino Fundamental II',
    motivo: 'Comportamento inadequado em sala de aula',
    descricao: '',
    usuarioId: '1',
    usuarioNome: 'WILEKA CARDOSO DOS SANTOS SOUSA',
    data: new Date('2025-01-10'),
    status: 'aprovada',
    aprovadaPor: 'COORDENADOR',
    aprovadaEm: new Date('2025-01-11'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const MOCK_CANCELADAS: Ocorrencia[] = [];
