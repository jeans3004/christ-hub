/**
 * Tipos e constantes para a pagina de mensagens WhatsApp.
 */

import { Usuario, MensagemLog, TemplateMensagem, GrupoWhatsApp, MensagemTipo } from '@/types';

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
export type TabValue = 'enviar' | 'historico' | 'templates' | 'grupos';

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
