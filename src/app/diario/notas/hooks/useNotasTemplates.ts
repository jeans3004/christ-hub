/**
 * Hook para gerenciamento de templates de composicao.
 */

import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { NotaComposicao } from '@/types';
import { DEFAULT_TEMPLATE } from '../types';

interface UseNotasTemplatesReturn {
  templateAv1: NotaComposicao[];
  templateAv2: NotaComposicao[];
  templateModalOpen: boolean;
  editingTemplateAv: 'av1' | 'av2' | null;
  templateSubNotas: NotaComposicao[];
  novaSubNota: { nome: string; porcentagem: number };
  setNovaSubNota: React.Dispatch<React.SetStateAction<{ nome: string; porcentagem: number }>>;
  handleOpenTemplateModal: (av: 'av1' | 'av2') => void;
  handleCloseTemplateModal: () => void;
  handleSaveTemplate: () => void;
  handleAddTemplateSubNota: () => void;
  handleRemoveTemplateSubNota: (id: string) => void;
  handleTemplateSubNotaPorcentagemChange: (id: string, value: string) => void;
  getTemplate: (av: 'av1' | 'av2') => NotaComposicao[];
  getTemplateSoma: () => number;
}

export function useNotasTemplates(): UseNotasTemplatesReturn {
  const { addToast } = useUIStore();

  // Templates de composicao para AV1 e AV2 (estrutura dos componentes)
  const [templateAv1, setTemplateAv1] = useState<NotaComposicao[]>([...DEFAULT_TEMPLATE]);
  const [templateAv2, setTemplateAv2] = useState<NotaComposicao[]>([...DEFAULT_TEMPLATE]);

  // Modal de edicao de template
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplateAv, setEditingTemplateAv] = useState<'av1' | 'av2' | null>(null);
  const [templateSubNotas, setTemplateSubNotas] = useState<NotaComposicao[]>([]);
  const [novaSubNota, setNovaSubNota] = useState({ nome: '', porcentagem: 0 });

  const getTemplate = useCallback((av: 'av1' | 'av2'): NotaComposicao[] => {
    return av === 'av1' ? templateAv1 : templateAv2;
  }, [templateAv1, templateAv2]);

  const getTemplateSoma = useCallback((): number => {
    return templateSubNotas.reduce((acc, s) => acc + s.porcentagem, 0);
  }, [templateSubNotas]);

  const handleOpenTemplateModal = useCallback((av: 'av1' | 'av2') => {
    setEditingTemplateAv(av);
    const template = av === 'av1' ? templateAv1 : templateAv2;
    setTemplateSubNotas([...template]);
    setTemplateModalOpen(true);
  }, [templateAv1, templateAv2]);

  const handleCloseTemplateModal = useCallback(() => {
    setTemplateModalOpen(false);
    setEditingTemplateAv(null);
    setNovaSubNota({ nome: '', porcentagem: 0 });
  }, []);

  const handleSaveTemplate = useCallback(() => {
    if (templateSubNotas.length === 0) {
      addToast('Adicione pelo menos um componente', 'error');
      return;
    }

    // Verificar se todos os valores estao entre 0.5 e 10
    const valoresInvalidos = templateSubNotas.some(s => s.porcentagem < 0.5 || s.porcentagem > 10);
    if (valoresInvalidos) {
      addToast('Todos os valores devem estar entre 0.5 e 10', 'error');
      return;
    }

    // A soma dos valores deve ser exatamente 10
    const soma = templateSubNotas.reduce((acc, s) => acc + s.porcentagem, 0);
    if (soma !== 10) {
      addToast(`A soma dos valores deve ser 10 (atual: ${soma})`, 'error');
      return;
    }

    if (editingTemplateAv === 'av1') {
      setTemplateAv1(templateSubNotas);
    } else {
      setTemplateAv2(templateSubNotas);
    }
    addToast(`Composição da ${editingTemplateAv?.toUpperCase()} salva!`, 'success');
    handleCloseTemplateModal();
  }, [templateSubNotas, editingTemplateAv, addToast, handleCloseTemplateModal]);

  const handleAddTemplateSubNota = useCallback(() => {
    if (!novaSubNota.nome || novaSubNota.porcentagem < 0.5 || novaSubNota.porcentagem > 10) {
      return;
    }

    const newSubNota: NotaComposicao = {
      id: Date.now().toString(),
      nome: novaSubNota.nome,
      porcentagem: novaSubNota.porcentagem,
      valor: null,
    };
    setTemplateSubNotas(prev => [...prev, newSubNota]);
    setNovaSubNota({ nome: '', porcentagem: 0 });
  }, [novaSubNota]);

  const handleRemoveTemplateSubNota = useCallback((id: string) => {
    setTemplateSubNotas(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleTemplateSubNotaPorcentagemChange = useCallback((id: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (numValue < 0 || numValue > 10) return;
    setTemplateSubNotas(prev => prev.map(s =>
      s.id === id ? { ...s, porcentagem: numValue } : s
    ));
  }, []);

  return {
    templateAv1,
    templateAv2,
    templateModalOpen,
    editingTemplateAv,
    templateSubNotas,
    novaSubNota,
    setNovaSubNota,
    handleOpenTemplateModal,
    handleCloseTemplateModal,
    handleSaveTemplate,
    handleAddTemplateSubNota,
    handleRemoveTemplateSubNota,
    handleTemplateSubNotaPorcentagemChange,
    getTemplate,
    getTemplateSoma,
  };
}
