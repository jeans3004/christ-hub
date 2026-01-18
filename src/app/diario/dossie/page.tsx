'use client';

/**
 * Pagina de Dossie do Aluno - visualizacao completa dos alunos.
 */

import { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import { useAuthStore } from '@/store/authStore';
import { useDossieData } from './hooks';
import {
  DossieFilters,
  AlunoCardList,
  AlunoDetailModal,
} from './components';

export default function DossiePage() {
  const { usuario } = useAuthStore();
  const {
    turmas,
    alunos,
    loadingTurmas,
    loadingAlunos,
    ano,
    turmaId,
    setAno,
    setTurmaId,
    modalState,
    dossieData,
    openModal,
    closeModal,
    canEdit,
  } = useDossieData();

  // Estado local para atualizar a foto no dossie sem recarregar tudo
  const [localDossie, setLocalDossie] = useState(dossieData);

  // Sincronizar com os dados do hook
  if (dossieData !== localDossie && dossieData !== null) {
    setLocalDossie(dossieData);
  }

  const handlePhotoChange = useCallback((newUrl: string | null) => {
    setLocalDossie((prev) =>
      prev ? { ...prev, fotoUrl: newUrl || undefined } : null
    );
  }, []);

  return (
    <MainLayout title="Dossie do Aluno">
      <DossieFilters
        ano={ano}
        setAno={setAno}
        turmaId={turmaId}
        setTurmaId={setTurmaId}
        turmas={turmas}
        loadingTurmas={loadingTurmas}
      />

      <AlunoCardList
        alunos={alunos}
        loading={loadingAlunos}
        turmaId={turmaId}
        onCardClick={openModal}
      />

      <AlunoDetailModal
        open={modalState.open}
        loading={modalState.loading}
        dossie={localDossie}
        canEdit={canEdit}
        usuario={usuario}
        ano={ano}
        onClose={closeModal}
        onPhotoChange={handlePhotoChange}
      />
    </MainLayout>
  );
}
