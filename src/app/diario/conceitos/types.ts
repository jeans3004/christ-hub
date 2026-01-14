/**
 * Tipos e constantes para o modulo de conceitos/rubricas.
 */

import { NivelRubrica } from '@/types';

// Cores para cada nivel de rubrica
export const NIVEL_COLORS: Record<NivelRubrica, { bg: string; text: string; border: string }> = {
  A: { bg: 'rgba(76, 175, 80, 0.15)', text: '#2E7D32', border: '#4CAF50' },
  B: { bg: 'rgba(33, 150, 243, 0.15)', text: '#1565C0', border: '#2196F3' },
  C: { bg: 'rgba(255, 193, 7, 0.15)', text: '#F57F17', border: '#FFC107' },
  D: { bg: 'rgba(255, 152, 0, 0.15)', text: '#E65100', border: '#FF9800' },
  E: { bg: 'rgba(244, 67, 54, 0.15)', text: '#C62828', border: '#F44336' },
};

// Labels descritivos para cada nivel
export const NIVEL_LABELS: Record<NivelRubrica, string> = {
  A: 'Excelente',
  B: 'Bom',
  C: 'Regular',
  D: 'Insuficiente',
  E: 'Crítico',
};

// Niveis disponiveis
export const NIVEIS: NivelRubrica[] = ['A', 'B', 'C', 'D', 'E'];

// Rubricas padrao para inicializacao
export const DEFAULT_RUBRICAS = [
  {
    nome: 'Participação',
    descricao: 'Avalia o envolvimento e participação ativa do aluno nas atividades',
    niveis: [
      { nivel: 'A' as NivelRubrica, descricao: 'Participa ativamente de todas as atividades, contribuindo com ideias e colaborando com os colegas' },
      { nivel: 'B' as NivelRubrica, descricao: 'Participa da maioria das atividades com boa contribuição' },
      { nivel: 'C' as NivelRubrica, descricao: 'Participa quando solicitado, mas com pouca iniciativa própria' },
      { nivel: 'D' as NivelRubrica, descricao: 'Raramente participa das atividades' },
      { nivel: 'E' as NivelRubrica, descricao: 'Não participa das atividades e demonstra desinteresse' },
    ],
  },
  {
    nome: 'Comportamento',
    descricao: 'Avalia a conduta e respeito às regras de convivência',
    niveis: [
      { nivel: 'A' as NivelRubrica, descricao: 'Comportamento exemplar, respeitoso com todos e segue todas as regras' },
      { nivel: 'B' as NivelRubrica, descricao: 'Bom comportamento com raras exceções' },
      { nivel: 'C' as NivelRubrica, descricao: 'Comportamento regular, ocasionalmente precisa de intervenção' },
      { nivel: 'D' as NivelRubrica, descricao: 'Comportamento inadequado frequente' },
      { nivel: 'E' as NivelRubrica, descricao: 'Comportamento constantemente inadequado, desrespeitoso' },
    ],
  },
  {
    nome: 'Organização',
    descricao: 'Avalia a organização do material e cumprimento de prazos',
    niveis: [
      { nivel: 'A' as NivelRubrica, descricao: 'Sempre organizado, material completo e entrega todas as atividades no prazo' },
      { nivel: 'B' as NivelRubrica, descricao: 'Geralmente organizado com poucas falhas' },
      { nivel: 'C' as NivelRubrica, descricao: 'Organização regular, algumas vezes esquece material ou prazos' },
      { nivel: 'D' as NivelRubrica, descricao: 'Frequentemente desorganizado' },
      { nivel: 'E' as NivelRubrica, descricao: 'Totalmente desorganizado, não cumpre prazos' },
    ],
  },
  {
    nome: 'Responsabilidade',
    descricao: 'Avalia o comprometimento com as obrigações escolares',
    niveis: [
      { nivel: 'A' as NivelRubrica, descricao: 'Totalmente responsável, cumpre todas as obrigações' },
      { nivel: 'B' as NivelRubrica, descricao: 'Responsável na maioria das situações' },
      { nivel: 'C' as NivelRubrica, descricao: 'Responsabilidade mediana, precisa de lembretes' },
      { nivel: 'D' as NivelRubrica, descricao: 'Pouco responsável' },
      { nivel: 'E' as NivelRubrica, descricao: 'Irresponsável, não cumpre obrigações' },
    ],
  },
];
