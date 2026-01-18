'use client';

/**
 * Hook para gerenciar dados da pagina de professores.
 */

import { useState, useCallback, useMemo } from 'react';
import { Professor } from '@/types';
import { useUIStore } from '@/store/uiStore';
import {
  ProfessorFormData,
  ProfessorFiltro,
  initialFormData,
  initialFiltro,
  mockProfessores,
} from '../types';
import { formatCPF, formatTelefone } from '../utils';

export function useProfessoresPage() {
  const { addToast } = useUIStore();
  const [professores, setProfessores] = useState<Professor[]>(mockProfessores);
  const [filtro, setFiltro] = useState<ProfessorFiltro>(initialFiltro);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: '' });
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [formData, setFormData] = useState<ProfessorFormData>(initialFormData);

  const filteredProfessores = useMemo(() => {
    return professores.filter((p) => {
      const matchNome = !filtro.nome || p.nome.toLowerCase().includes(filtro.nome.toLowerCase());
      const matchCpf = !filtro.cpf || p.cpf.includes(filtro.cpf);
      const matchTelefone = !filtro.telefone || (p.telefone && p.telefone.includes(filtro.telefone));
      return matchNome && matchCpf && matchTelefone;
    });
  }, [professores, filtro]);

  const handleOpenModal = useCallback((professor?: Professor) => {
    if (professor) {
      setEditingProfessor(professor);
      setFormData({
        nome: professor.nome,
        cpf: professor.cpf,
        telefone: professor.telefone || '',
        coordenador: professor.coordenador,
        disciplinas: professor.disciplinas,
      });
    } else {
      setEditingProfessor(null);
      setFormData(initialFormData);
    }
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleSave = useCallback(() => {
    if (editingProfessor) {
      setProfessores(prev =>
        prev.map(p =>
          p.id === editingProfessor.id
            ? { ...p, ...formData, updatedAt: new Date() }
            : p
        )
      );
      addToast('Professor atualizado com sucesso!', 'success');
    } else {
      const newProfessor: Professor = {
        id: Date.now().toString(),
        ...formData,
        turmas: [],
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProfessores(prev => [...prev, newProfessor]);
      addToast('Professor cadastrado com sucesso!', 'success');
    }
    setModalOpen(false);
  }, [editingProfessor, formData, addToast]);

  const handleDelete = useCallback((id: string) => {
    setProfessores(prev => prev.filter(p => p.id !== id));
    addToast('Professor excluído com sucesso!', 'success');
    setDeleteDialog({ open: false, id: '' });
  }, [addToast]);

  const handleDisciplinaToggle = useCallback((disciplina: string) => {
    setFormData(prev => ({
      ...prev,
      disciplinas: prev.disciplinas.includes(disciplina)
        ? prev.disciplinas.filter(d => d !== disciplina)
        : [...prev.disciplinas, disciplina],
    }));
  }, []);

  const handleFormChange = useCallback((field: keyof ProfessorFormData, value: string | boolean) => {
    if (field === 'cpf' && typeof value === 'string') {
      setFormData(prev => ({ ...prev, cpf: formatCPF(value) }));
    } else if (field === 'telefone' && typeof value === 'string') {
      setFormData(prev => ({ ...prev, telefone: formatTelefone(value) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  const handleFiltroChange = useCallback((field: keyof ProfessorFiltro, value: string) => {
    setFiltro(prev => ({ ...prev, [field]: value }));
  }, []);

  return {
    professores,
    filteredProfessores,
    filtro,
    modalOpen,
    deleteDialog,
    editingProfessor,
    formData,
    setDeleteDialog,
    handleOpenModal,
    handleCloseModal,
    handleSave,
    handleDelete,
    handleDisciplinaToggle,
    handleFormChange,
    handleFiltroChange,
  };
}
