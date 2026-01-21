/**
 * Templates pre-definidos para coordenacao escolar.
 * Estes templates sao carregados como opcoes iniciais para os usuarios.
 */

import { TemplateCategoria } from '@/types';
import { TemplatePreset, QuickAction } from '../types';

/**
 * Tipos de categoria expandidos para presets.
 */
export const TEMPLATE_CATEGORIAS_EXPANDIDAS = [
  { value: 'aviso', label: 'Avisos', icon: '⚠️', color: '#f59e0b' },
  { value: 'lembrete', label: 'Lembretes', icon: '📅', color: '#3b82f6' },
  { value: 'comunicado', label: 'Comunicados', icon: '📢', color: '#8b5cf6' },
  { value: 'reuniao', label: 'Reunioes', icon: '🤝', color: '#10b981' },
  { value: 'evento', label: 'Eventos', icon: '🎉', color: '#ec4899' },
  { value: 'outro', label: 'Outros', icon: '📝', color: '#6b7280' },
] as const;

/**
 * Templates pre-definidos para uso comum na escola.
 */
export const TEMPLATE_PRESETS: TemplatePreset[] = [
  // === AVISOS ===
  {
    id: 'aviso_geral',
    nome: 'Aviso Geral',
    categoria: 'aviso',
    conteudo: `{{saudacao}}, {{nome}}!

*AVISO IMPORTANTE*

{{mensagem}}

Atenciosamente,
Coordenacao Escolar`,
    variaveis: ['saudacao', 'nome', 'mensagem'],
    icone: '⚠️',
    descricao: 'Aviso geral para comunicados importantes',
  },
  {
    id: 'aviso_urgente',
    nome: 'Aviso Urgente',
    categoria: 'aviso',
    conteudo: `*🚨 AVISO URGENTE 🚨*

{{saudacao}}, {{nome}}!

{{mensagem}}

Por favor, confirme o recebimento desta mensagem.

Coordenacao Escolar`,
    variaveis: ['saudacao', 'nome', 'mensagem'],
    icone: '🚨',
    descricao: 'Para situacoes que requerem atencao imediata',
  },

  // === REUNIOES ===
  {
    id: 'reuniao_pais',
    nome: 'Convocacao de Reuniao de Pais',
    categoria: 'comunicado',
    conteudo: `{{saudacao}}, {{nome}}!

*CONVOCACAO PARA REUNIAO DE PAIS*

📅 *Data:* {{data}}
🕐 *Horario:* {{horario}}
📍 *Local:* {{local}}

*Pauta:*
{{pauta}}

Contamos com sua presenca!

Coordenacao Escolar`,
    variaveis: ['saudacao', 'nome', 'data', 'horario', 'local', 'pauta'],
    icone: '🤝',
    descricao: 'Convocacao para reuniao de pais e responsaveis',
  },
  {
    id: 'reuniao_professores',
    nome: 'Reuniao de Professores',
    categoria: 'comunicado',
    conteudo: `{{saudacao}}, {{nome}}!

*REUNIAO PEDAGOGICA*

📅 *Data:* {{data}}
🕐 *Horario:* {{horario}}
📍 *Local:* {{local}}

*Pauta:*
{{pauta}}

Presenca obrigatoria.

Coordenacao Pedagogica`,
    variaveis: ['saudacao', 'nome', 'data', 'horario', 'local', 'pauta'],
    icone: '👨‍🏫',
    descricao: 'Convocacao para reuniao de professores',
  },

  // === LEMBRETES ===
  {
    id: 'lembrete_prova',
    nome: 'Lembrete de Prova',
    categoria: 'lembrete',
    conteudo: `{{saudacao}}, {{nome}}!

*📝 LEMBRETE - AVALIACAO*

A avaliacao de *{{disciplina}}* sera realizada:

📅 *Data:* {{data}}
📚 *Conteudo:* {{conteudo}}

Boa preparacao!

Coordenacao Escolar`,
    variaveis: ['saudacao', 'nome', 'disciplina', 'data', 'conteudo'],
    icone: '📝',
    descricao: 'Lembrete de prova ou avaliacao',
  },
  {
    id: 'lembrete_entrega',
    nome: 'Lembrete de Entrega',
    categoria: 'lembrete',
    conteudo: `{{saudacao}}, {{nome}}!

*📋 LEMBRETE - ENTREGA DE TRABALHO*

O trabalho de *{{disciplina}}* deve ser entregue ate:

📅 *Data limite:* {{data}}
📎 *Descricao:* {{descricao}}

Coordenacao Escolar`,
    variaveis: ['saudacao', 'nome', 'disciplina', 'data', 'descricao'],
    icone: '📋',
    descricao: 'Lembrete de entrega de trabalho',
  },

  // === COMUNICADOS ===
  {
    id: 'comunicado_evento',
    nome: 'Comunicado de Evento',
    categoria: 'comunicado',
    conteudo: `{{saudacao}}, {{nome}}!

*🎉 {{titulo_evento}}*

Convidamos todos para participar:

📅 *Data:* {{data}}
🕐 *Horario:* {{horario}}
📍 *Local:* {{local}}

{{descricao}}

Esperamos voces!

Coordenacao Escolar`,
    variaveis: ['saudacao', 'nome', 'titulo_evento', 'data', 'horario', 'local', 'descricao'],
    icone: '🎉',
    descricao: 'Comunicado de eventos escolares',
  },
  {
    id: 'comunicado_feriado',
    nome: 'Comunicado de Feriado/Recesso',
    categoria: 'comunicado',
    conteudo: `{{saudacao}}, {{nome}}!

*📅 COMUNICADO - FERIADO/RECESSO*

Informamos que *nao havera aula* no(s) dia(s):

📅 *Periodo:* {{periodo}}
📝 *Motivo:* {{motivo}}

As aulas retornam normalmente em *{{data_retorno}}*.

Coordenacao Escolar`,
    variaveis: ['saudacao', 'nome', 'periodo', 'motivo', 'data_retorno'],
    icone: '🏖️',
    descricao: 'Comunicado de feriados e recessos',
  },
  {
    id: 'cancelamento_aula',
    nome: 'Cancelamento de Aula',
    categoria: 'aviso',
    conteudo: `{{saudacao}}, {{nome}}!

*⚠️ AVISO - CANCELAMENTO DE AULA*

Informamos que a aula de *{{disciplina}}* do dia *{{data}}* foi *CANCELADA*.

📝 *Motivo:* {{motivo}}

{{reposicao}}

Coordenacao Escolar`,
    variaveis: ['saudacao', 'nome', 'disciplina', 'data', 'motivo', 'reposicao'],
    icone: '🚫',
    descricao: 'Aviso de cancelamento de aula',
  },

  // === OUTROS ===
  {
    id: 'boletim_disponivel',
    nome: 'Boletim Disponivel',
    categoria: 'comunicado',
    conteudo: `{{saudacao}}, {{nome}}!

*📊 BOLETIM DISPONIVEL*

O boletim do *{{bimestre}}o Bimestre* ja esta disponivel para consulta.

Acesse o portal do aluno ou entre em contato com a secretaria para mais informacoes.

Coordenacao Escolar`,
    variaveis: ['saudacao', 'nome', 'bimestre'],
    icone: '📊',
    descricao: 'Aviso de disponibilidade de boletim',
  },
  {
    id: 'aniversario',
    nome: 'Felicitacao de Aniversario',
    categoria: 'outro',
    conteudo: `🎂 *FELIZ ANIVERSARIO!* 🎂

{{saudacao}}, {{nome}}!

A equipe escolar deseja a voce um dia muito especial e um ano repleto de realizacoes!

🎉🎈🎁

Com carinho,
Equipe Escolar`,
    variaveis: ['saudacao', 'nome'],
    icone: '🎂',
    descricao: 'Mensagem de aniversario',
  },
  {
    id: 'boas_vindas',
    nome: 'Boas-vindas ao Ano Letivo',
    categoria: 'comunicado',
    conteudo: `{{saudacao}}, {{nome}}!

*🎓 BEM-VINDO AO ANO LETIVO {{ano}}!*

Estamos muito felizes em te-lo(a) conosco para mais um ano de aprendizado e crescimento.

📅 *Inicio das aulas:* {{data_inicio}}
🕐 *Horario:* {{horario}}

Desejamos um excelente ano letivo!

Coordenacao Escolar`,
    variaveis: ['saudacao', 'nome', 'ano', 'data_inicio', 'horario'],
    icone: '🎓',
    descricao: 'Mensagem de boas-vindas ao ano letivo',
  },
];

/**
 * Acoes rapidas pre-configuradas.
 */
export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'aviso_geral',
    label: 'Aviso Geral',
    icon: '⚠️',
    color: 'warning',
    templateId: 'aviso_geral',
    description: 'Enviar aviso geral para professores',
  },
  {
    id: 'reuniao_pais',
    label: 'Reuniao de Pais',
    icon: '🤝',
    color: 'success',
    templateId: 'reuniao_pais',
    description: 'Convocar reuniao de pais',
  },
  {
    id: 'lembrete_prova',
    label: 'Lembrete de Prova',
    icon: '📝',
    color: 'info',
    templateId: 'lembrete_prova',
    description: 'Enviar lembrete de avaliacao',
  },
  {
    id: 'feriado',
    label: 'Feriado/Recesso',
    icon: '🏖️',
    color: 'secondary',
    templateId: 'comunicado_feriado',
    description: 'Comunicar feriado ou recesso',
  },
  {
    id: 'cancelamento_aula',
    label: 'Cancelar Aula',
    icon: '🚫',
    color: 'error',
    templateId: 'cancelamento_aula',
    description: 'Avisar cancelamento de aula',
  },
  {
    id: 'evento',
    label: 'Evento Escolar',
    icon: '🎉',
    color: 'primary',
    templateId: 'comunicado_evento',
    description: 'Comunicar evento escolar',
  },
  {
    id: 'enquete_rapida',
    label: 'Enquete',
    icon: '📊',
    color: 'info',
    description: 'Criar enquete rapida',
  },
];

/**
 * Obter saudacao baseada no horario atual.
 */
export function getSaudacaoAtual(): string {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Obter data formatada para templates.
 */
export function getDataFormatada(date: Date = new Date()): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Variaveis do sistema com valores automaticos.
 */
export function getVariaveisSistema(): Record<string, string> {
  const now = new Date();
  return {
    saudacao: getSaudacaoAtual(),
    data_atual: getDataFormatada(now),
    dia_semana: now.toLocaleDateString('pt-BR', { weekday: 'long' }),
    ano_letivo: now.getFullYear().toString(),
    ano: now.getFullYear().toString(),
  };
}
