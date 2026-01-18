/**
 * Hook para gerenciamento de templates de composicao.
 */

import { useState, useCallback, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { NotaComposicao } from '@/types';
import { templateComposicaoService } from '@/services/firestore';
import { DEFAULT_TEMPLATE } from '../types';
import { deepCopyTemplate, INITIAL_NOVA_SUBNOTA } from './templateTypes';
import type { UseNotasTemplatesProps, UseNotasTemplatesReturn, NovaSubNotaState } from './templateTypes';

export function useNotasTemplates({
  turmaId,
  disciplinaId,
  bimestre,
  ano,
}: UseNotasTemplatesProps): UseNotasTemplatesReturn {
  const { addToast } = useUIStore();

  const [templateAv1, setTemplateAv1] = useState<NotaComposicao[]>(() => deepCopyTemplate(DEFAULT_TEMPLATE));
  const [templateAv2, setTemplateAv2] = useState<NotaComposicao[]>(() => deepCopyTemplate(DEFAULT_TEMPLATE));
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplateAv, setEditingTemplateAv] = useState<'av1' | 'av2' | null>(null);
  const [templateSubNotas, setTemplateSubNotas] = useState<NotaComposicao[]>([]);
  const [novaSubNota, setNovaSubNota] = useState<NovaSubNotaState>(INITIAL_NOVA_SUBNOTA);

  // Carregar templates do Firestore
  useEffect(() => {
    async function loadTemplates() {
      if (!turmaId || !disciplinaId) {
        setTemplateAv1(deepCopyTemplate(DEFAULT_TEMPLATE));
        setTemplateAv2(deepCopyTemplate(DEFAULT_TEMPLATE));
        return;
      }

      setLoadingTemplates(true);
      try {
        const templates = await templateComposicaoService.getByTurmaDisciplinaBimestre(
          turmaId, disciplinaId, bimestre, ano
        );

        setTemplateAv1(templates.av1?.componentes ? deepCopyTemplate(templates.av1.componentes) : deepCopyTemplate(DEFAULT_TEMPLATE));
        setTemplateAv2(templates.av2?.componentes ? deepCopyTemplate(templates.av2.componentes) : deepCopyTemplate(DEFAULT_TEMPLATE));
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplateAv1(deepCopyTemplate(DEFAULT_TEMPLATE));
        setTemplateAv2(deepCopyTemplate(DEFAULT_TEMPLATE));
      } finally {
        setLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, [turmaId, disciplinaId, bimestre, ano]);

  const getTemplate = useCallback((av: 'av1' | 'av2') => (av === 'av1' ? templateAv1 : templateAv2), [templateAv1, templateAv2]);
  const getTemplateSoma = useCallback(() => templateSubNotas.reduce((acc, s) => acc + s.porcentagem, 0), [templateSubNotas]);

  const handleOpenTemplateModal = useCallback((av: 'av1' | 'av2') => {
    setEditingTemplateAv(av);
    setTemplateSubNotas(deepCopyTemplate(av === 'av1' ? templateAv1 : templateAv2));
    setTemplateModalOpen(true);
  }, [templateAv1, templateAv2]);

  const handleCloseTemplateModal = useCallback(() => {
    setTemplateModalOpen(false);
    setEditingTemplateAv(null);
    setNovaSubNota(INITIAL_NOVA_SUBNOTA);
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    if (templateSubNotas.length === 0) { addToast('Adicione pelo menos um componente', 'error'); return; }
    if (templateSubNotas.some((s) => s.porcentagem < 0.5 || s.porcentagem > 10)) { addToast('Todos os valores devem estar entre 0.5 e 10', 'error'); return; }
    const soma = templateSubNotas.reduce((acc, s) => acc + s.porcentagem, 0);
    if (soma !== 10) { addToast(`A soma dos valores deve ser 10 (atual: ${soma})`, 'error'); return; }
    if (!turmaId || !disciplinaId || !editingTemplateAv) { addToast('Selecione turma e disciplina primeiro', 'error'); return; }

    try {
      await templateComposicaoService.save(turmaId, disciplinaId, bimestre, editingTemplateAv, ano, deepCopyTemplate(templateSubNotas));
      if (editingTemplateAv === 'av1') setTemplateAv1(deepCopyTemplate(templateSubNotas));
      else setTemplateAv2(deepCopyTemplate(templateSubNotas));
      addToast(`Composicao da ${editingTemplateAv?.toUpperCase()} salva!`, 'success');
      handleCloseTemplateModal();
    } catch (error) {
      console.error('Error saving template:', error);
      addToast('Erro ao salvar composicao', 'error');
    }
  }, [templateSubNotas, editingTemplateAv, turmaId, disciplinaId, bimestre, ano, addToast, handleCloseTemplateModal]);

  const handleAddTemplateSubNota = useCallback(() => {
    if (!novaSubNota.nome || novaSubNota.porcentagem < 0.5 || novaSubNota.porcentagem > 10) return;
    const newSubNota: NotaComposicao = {
      id: Date.now().toString(),
      nome: novaSubNota.nome,
      porcentagem: novaSubNota.porcentagem,
      valor: null,
      quantidadeRubricas: novaSubNota.quantidadeRubricas,
    };
    setTemplateSubNotas((prev) => [...prev, newSubNota]);
    setNovaSubNota(INITIAL_NOVA_SUBNOTA);
  }, [novaSubNota]);

  const handleRemoveTemplateSubNota = useCallback((id: string) => {
    setTemplateSubNotas((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleTemplateSubNotaPorcentagemChange = useCallback((id: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (numValue < 0 || numValue > 10) return;
    setTemplateSubNotas((prev) => prev.map((s) => (s.id === id ? { ...s, porcentagem: numValue } : s)));
  }, []);

  const handleTemplateSubNotaRubricasChange = useCallback((id: string, value: 1 | 2 | 3) => {
    setTemplateSubNotas((prev) => prev.map((s) => (s.id === id ? { ...s, quantidadeRubricas: value } : s)));
  }, []);

  return {
    templateAv1, templateAv2, templateModalOpen, editingTemplateAv, templateSubNotas,
    novaSubNota, setNovaSubNota, loadingTemplates,
    handleOpenTemplateModal, handleCloseTemplateModal, handleSaveTemplate,
    handleAddTemplateSubNota, handleRemoveTemplateSubNota,
    handleTemplateSubNotaPorcentagemChange, handleTemplateSubNotaRubricasChange,
    getTemplate, getTemplateSoma,
  };
}
