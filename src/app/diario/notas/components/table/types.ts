/**
 * Tipos para componentes de tabela de notas.
 */

import { Aluno } from '@/types';
import { NotasAluno, ModoCell, ModoEntrada } from '../../types';

/**
 * Props da tabela de notas.
 */
export interface NotasTableProps {
  alunos: Aluno[];
  notas: Record<string, NotasAluno>;
  modosCells: Record<string, ModoCell>;
  saving: boolean;
  getModoCell: (alunoId: string, av: 'av1' | 'av2') => ModoCell;
  getComposicaoStatus: (alunoId: string, av: 'av1' | 'av2') => ComposicaoStatus;
  handleNotaChange: (alunoId: string, tipo: 'av1' | 'av2' | 'rp1' | 'rp2', valor: string) => void;
  calcularMedia: (alunoId: string) => string;
  handleSaveNotas: () => Promise<void>;
  handleOpenTemplateModal: (av: 'av1' | 'av2') => void;
  handleSelectModo: (modo: ModoEntrada, cellKey: string) => void;
  openCompositionModal: (cellKey: string) => void;
}

/**
 * Status da composicao para exibicao na celula.
 */
export type ComposicaoStatus = 'sem-template' | 'falta-avaliar' | 'pronto';

/**
 * Props da celula de nota (AV1/AV2).
 */
export interface NotaCellProps {
  alunoId: string;
  av: 'av1' | 'av2';
  nota: number | null | undefined;
  modoCell: ModoCell;
  composicaoStatus: ComposicaoStatus;
  onNotaChange: (valor: string) => void;
  onOpenMenu: (event: React.MouseEvent<HTMLElement>) => void;
  onOpenComposition: () => void;
  onOpenTemplateModal: () => void;
}

/**
 * Props da celula de recuperacao.
 */
export interface RecuperacaoCellProps {
  nota: number | null | undefined;
  onChange: (valor: string) => void;
}

/**
 * Props da celula de media.
 */
export interface MediaCellProps {
  mediaStr: string;
}

/**
 * Props do cabecalho da tabela.
 */
export interface NotasTableHeaderProps {
  onOpenTemplateModal: (av: 'av1' | 'av2') => void;
}

/**
 * Props do menu de modo.
 */
export interface ModoMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onSelectModo: (modo: ModoEntrada) => void;
}
