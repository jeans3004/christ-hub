/**
 * Hook para gerenciamento de dados de ocorrencias.
 */

import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { Ocorrencia } from '@/types';
import { MOCK_PENDENTES, MOCK_APROVADAS, MOCK_CANCELADAS } from '../types';

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  action: () => void;
}

interface UseOcorrenciasDataReturn {
  pendentes: Ocorrencia[];
  aprovadas: Ocorrencia[];
  canceladas: Ocorrencia[];
  editModalOpen: boolean;
  selectedOcorrencia: Ocorrencia | null;
  confirmDialog: ConfirmDialogState;
  handleAprovar: (ocorrencia: Ocorrencia) => void;
  handleCancelar: (ocorrencia: Ocorrencia) => void;
  handleEditar: (ocorrencia: Ocorrencia) => void;
  handleDevolver: (ocorrencia: Ocorrencia) => void;
  handleSaveEdit: () => void;
  closeEditModal: () => void;
  closeConfirmDialog: () => void;
}

export function useOcorrenciasData(): UseOcorrenciasDataReturn {
  const { addToast } = useUIStore();

  const [pendentes, setPendentes] = useState<Ocorrencia[]>(MOCK_PENDENTES);
  const [aprovadas, setAprovadas] = useState<Ocorrencia[]>(MOCK_APROVADAS);
  const [canceladas, setCanceladas] = useState<Ocorrencia[]>(MOCK_CANCELADAS);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<Ocorrencia | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
    action: () => {},
  });

  const handleAprovar = useCallback((ocorrencia: Ocorrencia) => {
    setConfirmDialog({
      open: true,
      title: 'Aprovar Ocorrência',
      message: `Deseja aprovar a ocorrência do aluno ${ocorrencia.alunoNome}?`,
      action: () => {
        setPendentes(prev => prev.filter(o => o.id !== ocorrencia.id));
        setAprovadas(prev => [...prev, { ...ocorrencia, status: 'aprovada' as const }]);
        addToast('Ocorrência aprovada com sucesso!', 'success');
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  }, [addToast]);

  const handleCancelar = useCallback((ocorrencia: Ocorrencia) => {
    setConfirmDialog({
      open: true,
      title: 'Cancelar Ocorrência',
      message: `Deseja cancelar a ocorrência do aluno ${ocorrencia.alunoNome}?`,
      action: () => {
        setPendentes(prev => prev.filter(o => o.id !== ocorrencia.id));
        setCanceladas(prev => [...prev, { ...ocorrencia, status: 'cancelada' as const }]);
        addToast('Ocorrência cancelada!', 'warning');
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  }, [addToast]);

  const handleEditar = useCallback((ocorrencia: Ocorrencia) => {
    setSelectedOcorrencia(ocorrencia);
    setEditModalOpen(true);
  }, []);

  const handleDevolver = useCallback((ocorrencia: Ocorrencia) => {
    setConfirmDialog({
      open: true,
      title: 'Devolver Ocorrência',
      message: `Deseja devolver a ocorrência do aluno ${ocorrencia.alunoNome} para pendente?`,
      action: () => {
        if (ocorrencia.status === 'aprovada') {
          setAprovadas(prev => prev.filter(o => o.id !== ocorrencia.id));
        } else {
          setCanceladas(prev => prev.filter(o => o.id !== ocorrencia.id));
        }
        setPendentes(prev => [...prev, { ...ocorrencia, status: 'pendente' as const }]);
        addToast('Ocorrência devolvida para pendente!', 'info');
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  }, [addToast]);

  const handleSaveEdit = useCallback(() => {
    addToast('Ocorrência atualizada!', 'success');
    setEditModalOpen(false);
  }, [addToast]);

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  }, []);

  return {
    pendentes,
    aprovadas,
    canceladas,
    editModalOpen,
    selectedOcorrencia,
    confirmDialog,
    handleAprovar,
    handleCancelar,
    handleEditar,
    handleDevolver,
    handleSaveEdit,
    closeEditModal,
    closeConfirmDialog,
  };
}
