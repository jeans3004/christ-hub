/**
 * Hook para gerenciar templates de mensagem.
 */

'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { templateMensagemService } from '@/services/firestore';
import { useAuth } from '@/hooks/useAuth';
import { TemplateMensagem } from '@/types';
import { TemplateMensagemCompleto, VariavelTemplate } from '../types';

interface UseTemplatesOptions {
  categoria?: string;
  apenasAtivos?: boolean;
}

interface UseTemplatesReturn {
  templates: TemplateMensagemCompleto[];
  loading: boolean;
  error: string | null;
  create: (data: Partial<TemplateMensagemCompleto>) => Promise<string | null>;
  update: (id: string, data: Partial<TemplateMensagemCompleto>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  incrementUsage: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Converte string[] de variáveis para VariavelTemplate[].
 */
function convertVariables(variaveis: string[]): VariavelTemplate[] {
  return variaveis.map((v) => ({
    chave: v.replace(/[{}]/g, ''),
    descricao: '',
    tipo: 'texto' as const,
    obrigatoria: false,
    fonte: 'manual' as const,
  }));
}

/**
 * Converte TemplateMensagem para TemplateMensagemCompleto.
 */
function adaptTemplate(t: TemplateMensagem): TemplateMensagemCompleto {
  return {
    id: t.id,
    nome: t.nome,
    conteudo: t.conteudo,
    categoria: t.categoria,
    tipo: 'text',
    variaveis: convertVariables(t.variaveis || []),
    criadoPor: t.criadoPorId,
    criadoEm: t.createdAt,
    usoCount: t.usageCount || 0,
    ativo: t.ativo,
  };
}

export function useTemplates(options?: UseTemplatesOptions): UseTemplatesReturn {
  const [rawTemplates, setRawTemplates] = useState<TemplateMensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { usuario } = useAuth();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await templateMensagemService.getAll();
      setRawTemplates(data);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
      setError('Erro ao carregar templates');
      setRawTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Adapta e filtra templates
  const templates = useMemo(() => {
    let filtered = rawTemplates.map(adaptTemplate);

    if (options?.categoria) {
      filtered = filtered.filter(t => t.categoria === options.categoria);
    }
    if (options?.apenasAtivos !== false) {
      filtered = filtered.filter(t => t.ativo);
    }

    // Ordenar por uso (mais usados primeiro) e depois por nome
    filtered.sort((a, b) => {
      if (b.usoCount !== a.usoCount) return b.usoCount - a.usoCount;
      return a.nome.localeCompare(b.nome);
    });

    return filtered;
  }, [rawTemplates, options?.categoria, options?.apenasAtivos]);

  const create = useCallback(async (data: Partial<TemplateMensagemCompleto>): Promise<string | null> => {
    try {
      const templateData = {
        nome: data.nome || 'Novo Template',
        conteudo: data.conteudo || '',
        categoria: data.categoria || 'outro',
        criadoPorId: usuario?.id || '',
        criadoPorNome: usuario?.nome || '',
        ativo: true,
      };

      const id = await templateMensagemService.create(templateData);
      await fetchTemplates();
      return id;
    } catch (err) {
      console.error('Erro ao criar template:', err);
      setError('Erro ao criar template');
      return null;
    }
  }, [usuario, fetchTemplates]);

  const update = useCallback(async (id: string, data: Partial<TemplateMensagemCompleto>): Promise<boolean> => {
    try {
      // Adapta o update para o formato do serviço
      const updateData: Partial<TemplateMensagem> = {};
      if (data.nome !== undefined) updateData.nome = data.nome;
      if (data.conteudo !== undefined) updateData.conteudo = data.conteudo;
      if (data.categoria !== undefined) updateData.categoria = data.categoria;
      if (data.ativo !== undefined) updateData.ativo = data.ativo;
      if (data.usoCount !== undefined) updateData.usageCount = data.usoCount;

      await templateMensagemService.update(id, updateData);
      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar template:', err);
      setError('Erro ao atualizar template');
      return false;
    }
  }, [fetchTemplates]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await templateMensagemService.update(id, { ativo: false });
      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('Erro ao remover template:', err);
      setError('Erro ao remover template');
      return false;
    }
  }, [fetchTemplates]);

  const incrementUsage = useCallback(async (id: string): Promise<void> => {
    try {
      await templateMensagemService.incrementUsage(id);
    } catch (err) {
      console.error('Erro ao incrementar uso:', err);
    }
  }, []);

  return {
    templates,
    loading,
    error,
    create,
    update,
    remove,
    incrementUsage,
    refresh: fetchTemplates,
  };
}
