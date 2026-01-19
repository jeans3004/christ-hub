/**
 * Servico para gerenciamento de templates de mensagens.
 */

import { TemplateMensagem, TemplateCategoria, TemplateVariables } from '@/types';
import {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
} from './base';

const COLLECTION = 'templatesMensagem';

/**
 * Extrair variaveis de um texto.
 * Procura por padroes {{variavel}}.
 */
export function extractVariables(texto: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = texto.match(regex) || [];
  return [...new Set(matches)]; // Remove duplicatas
}

/**
 * Substituir variaveis no texto.
 */
export function replaceVariables(texto: string, values: TemplateVariables): string {
  let result = texto;

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
  });

  return result;
}

export const templateMensagemService = {
  /**
   * Buscar template por ID.
   */
  get: (id: string) => getDocument<TemplateMensagem>(COLLECTION, id),

  /**
   * Buscar todos os templates ativos.
   */
  getAll: () =>
    getDocuments<TemplateMensagem>(COLLECTION, [
      where('ativo', '==', true),
      orderBy('nome'),
    ]),

  /**
   * Buscar todos (incluindo inativos) para admin.
   */
  getAllAdmin: () =>
    getDocuments<TemplateMensagem>(COLLECTION, [orderBy('nome')]),

  /**
   * Buscar por categoria.
   */
  getByCategoria: (categoria: TemplateCategoria) =>
    getDocuments<TemplateMensagem>(COLLECTION, [
      where('categoria', '==', categoria),
      where('ativo', '==', true),
      orderBy('nome'),
    ]),

  /**
   * Buscar templates criados por um usuario.
   */
  getByCriador: (criadoPorId: string) =>
    getDocuments<TemplateMensagem>(COLLECTION, [
      where('criadoPorId', '==', criadoPorId),
      orderBy('nome'),
    ]),

  /**
   * Criar template.
   */
  create: (data: Omit<TemplateMensagem, 'id' | 'createdAt' | 'updatedAt' | 'variaveis' | 'usageCount'>) => {
    const variaveis = extractVariables(data.conteudo);
    return createDocument<TemplateMensagem>(COLLECTION, {
      ...data,
      variaveis,
      usageCount: 0,
    });
  },

  /**
   * Atualizar template.
   */
  update: (id: string, data: Partial<TemplateMensagem>) => {
    // Se conteudo foi alterado, recalcular variaveis
    if (data.conteudo) {
      data.variaveis = extractVariables(data.conteudo);
    }
    return updateDocument<TemplateMensagem>(COLLECTION, id, data);
  },

  /**
   * Incrementar contador de uso.
   */
  incrementUsage: async (id: string) => {
    const template = await getDocument<TemplateMensagem>(COLLECTION, id);
    if (template) {
      return updateDocument<TemplateMensagem>(COLLECTION, id, {
        usageCount: (template.usageCount || 0) + 1,
      });
    }
  },

  /**
   * Ativar/desativar template.
   */
  toggleAtivo: async (id: string) => {
    const template = await getDocument<TemplateMensagem>(COLLECTION, id);
    if (template) {
      return updateDocument<TemplateMensagem>(COLLECTION, id, {
        ativo: !template.ativo,
      });
    }
  },

  /**
   * Deletar template (soft delete - apenas desativa).
   */
  delete: (id: string) =>
    updateDocument<TemplateMensagem>(COLLECTION, id, { ativo: false }),

  /**
   * Deletar permanentemente.
   */
  deletePermanent: (id: string) => deleteDocument(COLLECTION, id),

  /**
   * Processar template com variaveis.
   */
  processTemplate: async (
    templateId: string,
    values: TemplateVariables
  ): Promise<{ texto: string; error?: string }> => {
    const template = await getDocument<TemplateMensagem>(COLLECTION, templateId);

    if (!template) {
      return { texto: '', error: 'Template não encontrado' };
    }

    if (!template.ativo) {
      return { texto: '', error: 'Template inativo' };
    }

    const texto = replaceVariables(template.conteudo, values);

    // Incrementar uso
    await templateMensagemService.incrementUsage(templateId);

    return { texto };
  },
};
