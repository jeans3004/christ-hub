/**
 * Servico para gerenciamento de logs de mensagens WhatsApp.
 */

import { MensagemLog, MensagemStatus, MensagemTipo } from '@/types';
import {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
  limit,
  Timestamp,
} from './base';

const COLLECTION = 'mensagensLog';

export const mensagemLogService = {
  /**
   * Buscar log por ID.
   */
  get: (id: string) => getDocument<MensagemLog>(COLLECTION, id),

  /**
   * Buscar todos os logs (mais recentes primeiro).
   */
  getAll: (maxResults = 100) =>
    getDocuments<MensagemLog>(COLLECTION, [
      orderBy('enviadoEm', 'desc'),
      limit(maxResults),
    ]),

  /**
   * Buscar logs por status.
   */
  getByStatus: (status: MensagemStatus, maxResults = 50) =>
    getDocuments<MensagemLog>(COLLECTION, [
      where('status', '==', status),
      orderBy('enviadoEm', 'desc'),
      limit(maxResults),
    ]),

  /**
   * Buscar logs por tipo.
   */
  getByTipo: (tipo: MensagemTipo, maxResults = 50) =>
    getDocuments<MensagemLog>(COLLECTION, [
      where('tipo', '==', tipo),
      orderBy('enviadoEm', 'desc'),
      limit(maxResults),
    ]),

  /**
   * Buscar logs por destinatário.
   */
  getByDestinatario: (destinatarioId: string, maxResults = 50) =>
    getDocuments<MensagemLog>(COLLECTION, [
      where('destinatarioId', '==', destinatarioId),
      orderBy('enviadoEm', 'desc'),
      limit(maxResults),
    ]),

  /**
   * Buscar logs enviados por um usuário.
   */
  getByEnviadoPor: (enviadoPorId: string, maxResults = 50) =>
    getDocuments<MensagemLog>(COLLECTION, [
      where('enviadoPorId', '==', enviadoPorId),
      orderBy('enviadoEm', 'desc'),
      limit(maxResults),
    ]),

  /**
   * Buscar logs por período.
   */
  getByPeriodo: async (dataInicio: Date, dataFim: Date, maxResults = 100) => {
    return getDocuments<MensagemLog>(COLLECTION, [
      where('enviadoEm', '>=', Timestamp.fromDate(dataInicio)),
      where('enviadoEm', '<=', Timestamp.fromDate(dataFim)),
      orderBy('enviadoEm', 'desc'),
      limit(maxResults),
    ]);
  },

  /**
   * Criar log de mensagem.
   */
  create: (data: Omit<MensagemLog, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument<MensagemLog>(COLLECTION, data),

  /**
   * Atualizar log (ex: status de entrega).
   */
  update: (id: string, data: Partial<MensagemLog>) =>
    updateDocument<MensagemLog>(COLLECTION, id, data),

  /**
   * Atualizar status da mensagem.
   */
  updateStatus: async (id: string, status: MensagemStatus, extra?: Partial<MensagemLog>) => {
    const updateData: Partial<MensagemLog> = { status, ...extra };

    // Atualizar timestamps conforme status
    if (status === 'delivered') {
      updateData.entregueEm = new Date();
    } else if (status === 'read') {
      updateData.lidoEm = new Date();
    }

    return updateDocument<MensagemLog>(COLLECTION, id, updateData);
  },

  /**
   * Marcar mensagem como falha.
   */
  markAsFailed: (id: string, erro: string) =>
    updateDocument<MensagemLog>(COLLECTION, id, {
      status: 'failed',
      erro,
    }),

  /**
   * Deletar log.
   */
  delete: (id: string) => deleteDocument(COLLECTION, id),

  /**
   * Contar mensagens por status (para dashboard).
   */
  getStats: async (): Promise<{
    total: number;
    enviadas: number;
    entregues: number;
    lidas: number;
    falhas: number;
  }> => {
    const all = await getDocuments<MensagemLog>(COLLECTION, []);

    return {
      total: all.length,
      enviadas: all.filter((m) => m.status === 'sent').length,
      entregues: all.filter((m) => m.status === 'delivered').length,
      lidas: all.filter((m) => m.status === 'read').length,
      falhas: all.filter((m) => m.status === 'failed').length,
    };
  },
};
