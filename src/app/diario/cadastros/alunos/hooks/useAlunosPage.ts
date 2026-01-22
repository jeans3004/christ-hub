'use client';

/**
 * Hook para gerenciar dados da pagina de alunos.
 */

import { useState, useEffect, useCallback } from 'react';
import { alunoService, turmaService } from '@/services/firestore';
import { Aluno, Turma } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { useModal } from '@/hooks/useModal';
import { AlunoForm, initialForm } from '../types';

export function useAlunosPage(canAccess: boolean) {
  const { addToast } = useUIStore();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterTurmaId, setFilterTurmaId] = useState<string>('');
  const [form, setForm] = useState<AlunoForm>(initialForm);

  const formModal = useModal<Aluno>();
  const deleteModal = useModal<Aluno>();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [alunosData, turmasData] = await Promise.all([
        alunoService.getAll(),
        turmaService.getAll(),
      ]);
      setAlunos(alunosData);
      setTurmas(turmasData.filter(t => t.ativo));
    } catch (error) {
      console.error('Error loading data:', error);
      addToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (canAccess) {
      loadData();
    }
  }, [canAccess, loadData]);

  const handleOpenModal = useCallback((aluno?: Aluno) => {
    if (aluno) {
      // Buscar a turma para extrair ensino, serie, turma (letra) e turno
      const turma = turmas.find(t => t.id === aluno.turmaId);
      setForm({
        nome: aluno.nome,
        cpf: aluno.cpf || '',
        dataNascimento: aluno.dataNascimento
          ? new Date(aluno.dataNascimento).toISOString().split('T')[0]
          : '',
        turmaId: aluno.turmaId,
        matricula: aluno.matricula || '',
        ensino: turma?.ensino || 'Ensino Fundamental II',
        serie: turma?.serie || '6º Ano',
        turmaLetra: turma?.turma || 'A',
        turno: turma?.turno || 'Matutino',
      });
      formModal.open(aluno);
    } else {
      // Se há filtro de turma, preencher os campos da turma filtrada
      const turmaFiltrada = turmas.find(t => t.id === filterTurmaId);
      setForm({
        ...initialForm,
        turmaId: filterTurmaId,
        ensino: turmaFiltrada?.ensino || 'Ensino Fundamental II',
        serie: turmaFiltrada?.serie || '6º Ano',
        turmaLetra: turmaFiltrada?.turma || 'A',
        turno: turmaFiltrada?.turno || 'Matutino',
      });
      formModal.open();
    }
  }, [formModal, filterTurmaId, turmas]);

  const handleCloseModal = useCallback(() => {
    formModal.close();
    setForm(initialForm);
  }, [formModal]);

  const handleSave = useCallback(async () => {
    if (!form.nome || !form.turmaId) {
      addToast('Preencha nome e selecione uma turma válida', 'error');
      return;
    }

    setSaving(true);
    try {
      // Buscar turma para desnormalizar dados
      const turma = turmas.find(t => t.id === form.turmaId);

      const alunoData = {
        nome: form.nome,
        cpf: form.cpf || undefined,
        dataNascimento: form.dataNascimento ? new Date(form.dataNascimento) : undefined,
        turmaId: form.turmaId,
        matricula: form.matricula || undefined,
        // Dados desnormalizados da turma
        turma: turma?.nome || undefined,
        serie: turma?.serie || form.serie || undefined,
        ensino: turma?.ensino || form.ensino || undefined,
        turno: turma?.turno || form.turno || undefined,
        ativo: true,
      };

      if (formModal.data) {
        await alunoService.update(formModal.data.id, alunoData);
        addToast('Aluno atualizado com sucesso!', 'success');
      } else {
        await alunoService.create(alunoData);
        addToast('Aluno cadastrado com sucesso!', 'success');
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error saving aluno:', error);
      addToast('Erro ao salvar aluno', 'error');
    } finally {
      setSaving(false);
    }
  }, [form, formModal.data, addToast, handleCloseModal, loadData, turmas]);

  const handleDelete = useCallback(async () => {
    if (!deleteModal.data) return;

    try {
      await alunoService.update(deleteModal.data.id, { ativo: false });
      addToast('Aluno desativado com sucesso!', 'success');
      deleteModal.close();
      loadData();
    } catch (error) {
      console.error('Error deleting aluno:', error);
      addToast('Erro ao desativar aluno', 'error');
    }
  }, [deleteModal, addToast, loadData]);

  const getTurmaNome = useCallback((turmaId: string) => {
    const turma = turmas.find(t => t.id === turmaId);
    return turma?.nome || '-';
  }, [turmas]);

  const filteredAlunos = filterTurmaId
    ? alunos.filter(a => a.turmaId === filterTurmaId)
    : alunos;

  return {
    alunos,
    filteredAlunos,
    turmas,
    loading,
    saving,
    form,
    setForm,
    filterTurmaId,
    setFilterTurmaId,
    formModal,
    deleteModal,
    handleOpenModal,
    handleCloseModal,
    handleSave,
    handleDelete,
    getTurmaNome,
    refetch: loadData,
  };
}
