/**
 * Tipos e constantes para a pagina de mensagens WhatsApp.
 */

import { Usuario, MensagemLog, TemplateMensagem, GrupoWhatsApp, MensagemTipo, TemplateCategoria } from '@/types';

// ===== TIPOS DO COMPOSITOR =====

// Tipos de mensagem suportados pela Evolution API
export type TipoMensagemMedia =
  | 'text'      // Texto simples/formatado
  | 'image'     // Imagem com caption opcional
  | 'document'  // PDF, DOC, XLS, etc.
  | 'audio'     // Áudio (gravado ou arquivo)
  | 'video'     // Vídeo com caption opcional
  | 'location'  // Localização GPS
  | 'contact'   // Cartão de contato
  | 'sticker';  // Figurinha

// Payload da mensagem para envio
export interface MensagemPayload {
  tipo: TipoMensagemMedia;
  // Texto
  texto?: string;
  // Mídia
  mediaUrl?: string;
  mediaBase64?: string;
  mimetype?: string;
  filename?: string;
  caption?: string;
  // Localização
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
  // Contato
  contactName?: string;
  contactPhone?: string;
  // Metadados
  linkPreview?: boolean;
  // Variáveis preenchidas (para templates)
  variaveis?: Record<string, string>;
}

// Tipos de formatação WhatsApp
export type FormatType = 'bold' | 'italic' | 'strike' | 'mono' | 'code' | 'list' | 'quote';

// Tipos de anexo
export type AttachmentType = 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact';

// Variável de template
export interface VariavelTemplate {
  chave: string;
  descricao: string;
  tipo: 'texto' | 'data' | 'numero' | 'lista';
  obrigatoria: boolean;
  valorPadrao?: string;
  fonte?: 'usuario' | 'aluno' | 'turma' | 'sistema' | 'manual';
}

// Template de mensagem expandido
export interface TemplateMensagemCompleto {
  id: string;
  nome: string;
  categoria: TemplateCategoria;
  conteudo: string;
  tipo: TipoMensagemMedia;
  variaveis: VariavelTemplate[];
  mediaUrl?: string;
  criadoPor: string;
  criadoEm: Date;
  usoCount: number;
  ativo: boolean;
}

// Marcadores de formatação WhatsApp
export const FORMAT_MARKERS: Record<FormatType, { prefix: string; suffix: string }> = {
  bold: { prefix: '*', suffix: '*' },
  italic: { prefix: '_', suffix: '_' },
  strike: { prefix: '~', suffix: '~' },
  mono: { prefix: '`', suffix: '`' },
  code: { prefix: '```\n', suffix: '\n```' },
  list: { prefix: '• ', suffix: '' },
  quote: { prefix: '> ', suffix: '' },
};

// Limites de tamanho de mídia (em bytes)
export const MEDIA_SIZE_LIMITS: Record<string, number> = {
  image: 5 * 1024 * 1024,      // 5MB
  document: 100 * 1024 * 1024, // 100MB
  audio: 16 * 1024 * 1024,     // 16MB
  video: 16 * 1024 * 1024,     // 16MB
};

// Tipos MIME aceitos por tipo de mídia
export const MEDIA_ACCEPT_TYPES: Record<string, string> = {
  image: 'image/jpeg,image/png,image/gif,image/webp',
  document: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv',
  audio: 'audio/mpeg,audio/ogg,audio/wav,audio/mp4',
  video: 'video/mp4,video/3gpp,video/quicktime',
};

// Variáveis do sistema pré-definidas
export const VARIAVEIS_SISTEMA: VariavelTemplate[] = [
  { chave: 'nome', descricao: 'Nome do destinatário', tipo: 'texto', obrigatoria: false, fonte: 'usuario' },
  { chave: 'turma', descricao: 'Nome da turma', tipo: 'texto', obrigatoria: false, fonte: 'turma' },
  { chave: 'escola', descricao: 'Nome da escola', tipo: 'texto', obrigatoria: false, fonte: 'sistema' },
  { chave: 'data_atual', descricao: 'Data atual formatada', tipo: 'data', obrigatoria: false, fonte: 'sistema' },
  { chave: 'dia_semana', descricao: 'Dia da semana', tipo: 'texto', obrigatoria: false, fonte: 'sistema' },
  { chave: 'saudacao', descricao: 'Bom dia/Boa tarde/Boa noite', tipo: 'texto', obrigatoria: false, fonte: 'sistema' },
  { chave: 'ano_letivo', descricao: 'Ano letivo atual', tipo: 'texto', obrigatoria: false, fonte: 'sistema' },
];

// Categorias de templates (compatível com TemplateCategoria)
export const TEMPLATE_CATEGORIAS = [
  { value: 'aviso', label: 'Avisos', icon: '⚠️' },
  { value: 'lembrete', label: 'Lembretes', icon: '📅' },
  { value: 'comunicado', label: 'Comunicados', icon: '📢' },
  { value: 'outro', label: 'Outros', icon: '📝' },
] as const;

// ===== TIPOS ORIGINAIS =====

// Destinatario para envio
export interface Destinatario {
  id: string;
  nome: string;
  numero: string;
  tipo?: string;
  email?: string;
}

// Estado do formulario de envio
export interface MensagemFormData {
  mensagem: string;
  destinatarios: Destinatario[];
  tipo: MensagemTipo;
  grupoId?: string;
  templateId?: string;
}

export const initialFormData: MensagemFormData = {
  mensagem: '',
  destinatarios: [],
  tipo: 'individual',
};

// Filtro do historico
export interface HistoricoFiltro {
  status: 'todos' | 'sent' | 'delivered' | 'read' | 'failed';
  tipo: 'todos' | 'individual' | 'broadcast' | 'grupo';
  periodo: 'hoje' | 'semana' | 'mes' | 'todos';
}

export const initialFiltro: HistoricoFiltro = {
  status: 'todos',
  tipo: 'todos',
  periodo: 'semana',
};

// Status da conexao WhatsApp
export interface WhatsAppStatus {
  connected: boolean;
  phoneNumber?: string;
  profileName?: string;
  profilePicUrl?: string;
  error?: string;
  loading: boolean;
}

export const initialStatus: WhatsAppStatus = {
  connected: false,
  loading: true,
};

// Resultado do envio
export interface SendResult {
  success: boolean;
  total: number;
  enviadas: number;
  falhas: number;
  results?: Array<{
    id: string;
    nome: string;
    success: boolean;
    error?: string;
  }>;
}

// Tab ativa na pagina
export type TabValue = 'enviar' | 'grupos' | 'templates' | 'enquetes' | 'historico';

// ===== TIPOS DE ENQUETES/POLLS =====

export interface PollOption {
  optionName: string;
}

export interface PollPayload {
  name: string;
  selectableCount: 1 | number; // 1 = single choice, >1 = multiple choice
  values: string[];
}

export interface EnqueteFormData {
  pergunta: string;
  opcoes: string[];
  multiplaEscolha: boolean;
  maxSelecoes: number;
}

export const initialEnqueteForm: EnqueteFormData = {
  pergunta: '',
  opcoes: ['', ''],
  multiplaEscolha: false,
  maxSelecoes: 1,
};

// ===== TIPOS DE QUICK ACTIONS =====

export type QuickActionType =
  | 'aviso_geral'
  | 'reuniao_pais'
  | 'lembrete_prova'
  | 'feriado'
  | 'cancelamento_aula'
  | 'evento'
  | 'enquete_rapida';

export interface QuickAction {
  id: QuickActionType;
  label: string;
  icon: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  templateId?: string;
  description: string;
}

// ===== TEMPLATE PRESETS =====

export interface TemplatePreset {
  id: string;
  nome: string;
  categoria: TemplateCategoria;
  conteudo: string;
  variaveis: string[];
  icone: string;
  descricao: string;
}

// Tipos de categoria expandidos para presets
export const TEMPLATE_CATEGORIAS_EXPANDIDAS = [
  { value: 'aviso', label: 'Avisos', icon: '⚠️', color: '#f59e0b' },
  { value: 'lembrete', label: 'Lembretes', icon: '📅', color: '#3b82f6' },
  { value: 'comunicado', label: 'Comunicados', icon: '📢', color: '#8b5cf6' },
  { value: 'reuniao', label: 'Reuniões', icon: '🤝', color: '#10b981' },
  { value: 'evento', label: 'Eventos', icon: '🎉', color: '#ec4899' },
  { value: 'outro', label: 'Outros', icon: '📝', color: '#6b7280' },
] as const;

// Converter Usuario para Destinatario
export function usuarioToDestinatario(usuario: Usuario): Destinatario | null {
  if (!usuario.celular) return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    numero: usuario.celular,
    tipo: usuario.tipo,
    email: usuario.googleEmail || usuario.email,
  };
}

// Filtrar usuarios com celular
export function filterUsuariosComCelular(usuarios: Usuario[]): Destinatario[] {
  return usuarios
    .filter((u) => u.ativo && u.celular)
    .map(usuarioToDestinatario)
    .filter((d): d is Destinatario => d !== null);
}

// Formatar numero para exibicao
export function formatPhoneDisplay(numero: string): string {
  const digits = numero.replace(/\D/g, '');

  // Remove 55 do inicio se tiver
  const localDigits = digits.startsWith('55') ? digits.slice(2) : digits;

  if (localDigits.length === 11) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 7)}-${localDigits.slice(7)}`;
  }
  if (localDigits.length === 10) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 6)}-${localDigits.slice(6)}`;
  }

  return numero;
}

// Calcular data de inicio do periodo
export function getPeriodoStartDate(periodo: HistoricoFiltro['periodo']): Date | null {
  const now = new Date();

  switch (periodo) {
    case 'hoje':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'semana':
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    case 'mes':
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo;
    default:
      return null;
  }
}
