/**
 * Tipos especificos da pagina de Mapeamento de Sala.
 */

import { Aluno, Assento, LayoutSala, TipoAssento } from '@/types';

/**
 * Aluno com informacoes para exibicao no mapa
 */
export interface AlunoMapa extends Pick<Aluno, 'id' | 'nome' | 'fotoUrl'> {
  iniciais: string;
}

/**
 * Celula do grid com informacoes completas
 */
export interface CelulaMapa extends Assento {
  aluno?: AlunoMapa;
}

/**
 * Modo de edicao do mapeamento
 */
export type ModoEdicao =
  | 'visualizar'    // Modo somente visualizacao
  | 'selecionar'    // Modo para arrastar e atribuir alunos
  | 'editar_tipo'   // Modo para alterar tipo da celula
  | 'remover'       // Modo para remover alunos
  | 'atribuir'      // Alias para selecionar (usado em componentes)
  | 'remover_aluno'; // Alias para remover (usado em componentes)

/**
 * Estado do mapeamento
 */
export interface MapeamentoState {
  layout: LayoutSala;
  celulas: CelulaMapa[];
  isDirty: boolean;
}

/**
 * Configuracao padrao do layout
 */
export const DEFAULT_LAYOUT: LayoutSala = {
  rows: 5,
  columns: 6,
};

/**
 * Limites de layout
 */
export const LAYOUT_LIMITS = {
  minRows: 2,
  maxRows: 10,
  minColumns: 2,
  maxColumns: 10,
};

/**
 * Cores dos tipos de assento (light e dark mode)
 */
export const TIPO_COLORS: Record<TipoAssento, { bg: string; border: string; bgDark: string; borderDark: string }> = {
  mesa: { bg: '#e3f2fd', border: '#1976d2', bgDark: '#0d2137', borderDark: '#42a5f5' },
  vazio: { bg: '#f5f5f5', border: '#e0e0e0', bgDark: '#2c2c2c', borderDark: '#555555' },
  professor: { bg: '#fff3e0', border: '#ff9800', bgDark: '#3e2723', borderDark: '#ffb74d' },
};

/**
 * Labels dos tipos de assento
 */
export const TIPO_LABELS: Record<TipoAssento, string> = {
  mesa: 'Mesa',
  vazio: 'Vazio',
  professor: 'Professor',
};

/**
 * Gera iniciais do nome
 */
export function getIniciais(nome: string): string {
  const parts = nome.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0]?.substring(0, 2).toUpperCase() || '';
}

/**
 * Gera layout inicial com todas as celulas como mesa
 */
export function gerarLayoutInicial(layout: LayoutSala): CelulaMapa[] {
  const celulas: CelulaMapa[] = [];
  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.columns; col++) {
      celulas.push({
        row,
        column: col,
        alunoId: null,
        tipo: 'mesa',
      });
    }
  }
  return celulas;
}

/**
 * Encontra celula por posicao
 */
export function findCelula(celulas: CelulaMapa[], row: number, col: number): CelulaMapa | undefined {
  return celulas.find((c) => c.row === row && c.column === col);
}
