/**
 * Hook para gerenciamento de templates de composicao.
 * Persiste os templates no Firestore por turma/disciplina/bimestre/ano.
 */

import { useState, useCallback, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { NotaComposicao } from '@/types';
import { templateComposicaoService } from '@/services/firestore';
import { DEFAULT_TEMPLATE } from '../types';

interface UseNotasTemplatesProps {
  turmaId: string;
  disciplinaId: string;
  bimestre: number;
  ano: number;
}

interface UseNotasTemplatesReturn {
  templateAv1: NotaComposicao[];
  templateAv2: NotaComposicao[];
  templateModalOpen: boolean;
  editingTemplateAv: 'av1' | 'av2' | null;
  templateSubNotas: NotaComposicao[];
  novaSubNota: { nome: string; porcentagem: number; quantidadeRubricas: 1 | 2 | 3 };
  setNovaSubNota: React.Dispatch<React.SetStateAction<{ nome: string; porcentagem: number; quantidadeRubricas: 1 | 2 | 3 }>>;
  loadingTemplates: boolean;
  handleOpenTemplateModal: (av: 'av1' | 'av2') => void;
  handleCloseTemplateModal: () => void;
  handleSaveTemplate: () => Promise<void>;
  handleAddTemplateSubNota: () => void;
  handleRemoveTemplateSubNota: (id: string) => void;
  handleTemplateSubNotaPorcentagemChange: (id: string, value: string) => void;
  handleTemplateSubNotaRubricasChange: (id: string, value: 1 | 2 | 3) => void;
  getTemplate: (av: 'av1' | 'av2') => NotaComposicao[];
  getTemplateSoma: () => number;
}

// Helper para cópia profunda do template
const deepCopyTemplate = (template: NotaComposicao[]): NotaComposicao[] => {
  return template.map(item => ({ ...item }));
};

export function useNotasTemplates({
  turmaId,
  disciplinaId,
  bimestre,
  ano,
}: UseNotasTemplatesProps): UseNotasTemplatesReturn {
  const { addToast } = useUIStore();

  // Templates de composicao para AV1 e AV2 (estrutura dos componentes)
  const [templateAv1, setTemplateAv1] = useState<NotaComposicao[]>(() => deepCopyTemplate(DEFAULT_TEMPLATE));
  const [templateAv2, setTemplateAv2] = useState<NotaComposicao[]>(() => deepCopyTemplate(DEFAULT_TEMPLATE));
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Modal de edicao de template
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplateAv, setEditingTemplateAv] = useState<'av1' | 'av2' | null>(null);
  const [templateSubNotas, setTemplateSubNotas] = useState<NotaComposicao[]>([]);
  const [novaSubNota, setNovaSubNota] = useState<{ nome: string; porcentagem: number; quantidadeRubricas: 1 | 2 | 3 }>({ nome: '', porcentagem: 0, quantidadeRubricas: 1 });

  // Carregar templates do Firestore quando turma/disciplina/bimestre/ano mudar
  useEffect(() => {
    async function loadTemplates() {
      if (!turmaId || !disciplinaId) {
        // Reset to default when no turma/disciplina selected
        setTemplateAv1(deepCopyTemplate(DEFAULT_TEMPLATE));
        setTemplateAv2(deepCopyTemplate(DEFAULT_TEMPLATE));
        return;
      }

      setLoadingTemplates(true);
      try {
        const templates = await templateComposicaoService.getByTurmaDisciplinaBimestre(
          turmaId,
          disciplinaId,
          bimestre,
          ano
        );

        if (templates.av1?.componentes) {
          setTemplateAv1(deepCopyTemplate(templates.av1.componentes));
        } else {
          setTemplateAv1(deepCopyTemplate(DEFAULT_TEMPLATE));
        }

        if (templates.av2?.componentes) {
          setTemplateAv2(deepCopyTemplate(templates.av2.componentes));
        } else {
          setTemplateAv2(deepCopyTemplate(DEFAULT_TEMPLATE));
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        // Use default on error
        setTemplateAv1(deepCopyTemplate(DEFAULT_TEMPLATE));
        setTemplateAv2(deepCopyTemplate(DEFAULT_TEMPLATE));
      } finally {
        setLoadingTemplates(false);
      }
    }

    loadTemplates();
  }, [turmaId, disciplinaId, bimestre, ano]);

  const getTemplate = useCallback((av: 'av1' | 'av2'): NotaComposicao[] => {
    return av === 'av1' ? templateAv1 : templateAv2;
  }, [templateAv1, templateAv2]);

  const getTemplateSoma = useCallback((): number => {
    return templateSubNotas.reduce((acc, s) => acc + s.porcentagem, 0);
  }, [templateSubNotas]);

  const handleOpenTemplateModal = useCallback((av: 'av1' | 'av2') => {
    setEditingTemplateAv(av);
    const template = av === 'av1' ? templateAv1 : templateAv2;
    setTemplateSubNotas(deepCopyTemplate(template));
    setTemplateModalOpen(true);
  }, [templateAv1, templateAv2]);

  const handleCloseTemplateModal = useCallback(() => {
    setTemplateModalOpen(false);
    setEditingTemplateAv(null);
    setNovaSubNota({ nome: '', porcentagem: 0, quantidadeRubricas: 1 });
  }, []);

  const handleSaveTemplate = useCallback(async () => {
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

    if (!turmaId || !disciplinaId || !editingTemplateAv) {
      addToast('Selecione turma e disciplina primeiro', 'error');
      return;
    }

    try {
      // Salvar no Firestore
      await templateComposicaoService.save(
        turmaId,
        disciplinaId,
        bimestre,
        editingTemplateAv,
        ano,
        deepCopyTemplate(templateSubNotas)
      );

      // Atualizar estado local
      if (editingTemplateAv === 'av1') {
        setTemplateAv1(deepCopyTemplate(templateSubNotas));
      } else {
        setTemplateAv2(deepCopyTemplate(templateSubNotas));
      }

      addToast(`Composição da ${editingTemplateAv?.toUpperCase()} salva!`, 'success');
      handleCloseTemplateModal();
    } catch (error) {
      console.error('Error saving template:', error);
      addToast('Erro ao salvar composição', 'error');
    }
  }, [templateSubNotas, editingTemplateAv, turmaId, disciplinaId, bimestre, ano, addToast, handleCloseTemplateModal]);

  const handleAddTemplateSubNota = useCallback(() => {
    if (!novaSubNota.nome || novaSubNota.porcentagem < 0.5 || novaSubNota.porcentagem > 10) {
      return;
    }

    const newSubNota: NotaComposicao = {
      id: Date.now().toString(),
      nome: novaSubNota.nome,
      porcentagem: novaSubNota.porcentagem,
      valor: null,
      quantidadeRubricas: novaSubNota.quantidadeRubricas,
    };
    setTemplateSubNotas(prev => [...prev, newSubNota]);
    setNovaSubNota({ nome: '', porcentagem: 0, quantidadeRubricas: 1 });
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

  const handleTemplateSubNotaRubricasChange = useCallback((id: string, value: 1 | 2 | 3) => {
    setTemplateSubNotas(prev => prev.map(s =>
      s.id === id ? { ...s, quantidadeRubricas: value } : s
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
    loadingTemplates,
    handleOpenTemplateModal,
    handleCloseTemplateModal,
    handleSaveTemplate,
    handleAddTemplateSubNota,
    handleRemoveTemplateSubNota,
    handleTemplateSubNotaPorcentagemChange,
    handleTemplateSubNotaRubricasChange,
    getTemplate,
    getTemplateSoma,
  };
}
