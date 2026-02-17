'use client';

/**
 * Pagina de ocorrencias - gerencia ocorrencias de alunos.
 */

import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useFilterStore } from '@/store/filterStore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { eAlunoConfigService } from '@/services/firestore/eAlunoConfigService';
import { EAlunoConfig } from '@/types';
import { useOcorrenciasData } from './hooks';
import {
  OcorrenciaFilters,
  OcorrenciaTabs,
  OcorrenciaEditModal,
} from './components';

export default function OcorrenciasPage() {
  const { ano, setAno } = useFilterStore();
  const { addToast } = useUIStore();
  const { usuario } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [eAlunoConfig, setEAlunoConfig] = useState<EAlunoConfig | null>(null);

  // Load SGE config
  useEffect(() => {
    if (usuario?.id) {
      eAlunoConfigService.getByUser(usuario.id).then(setEAlunoConfig).catch(() => {});
    }
  }, [usuario?.id]);

  const {
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
  } = useOcorrenciasData();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePrint = () => {
    addToast('Gerando impressão...', 'info');
  };

  return (
    <MainLayout title="Ocorrências">
      <Box sx={{ display: 'flex', gap: { xs: 0, md: 1.5 }, flexDirection: { xs: 'column', md: 'row' } }}>
        <OcorrenciaFilters ano={ano} onAnoChange={setAno} />

        <OcorrenciaTabs
          tabValue={tabValue}
          onTabChange={handleTabChange}
          pendentes={pendentes}
          aprovadas={aprovadas}
          canceladas={canceladas}
          onAprovar={handleAprovar}
          onEditar={handleEditar}
          onCancelar={handleCancelar}
          onDevolver={handleDevolver}
          onPrint={handlePrint}
        />
      </Box>

      <OcorrenciaEditModal
        open={editModalOpen}
        ocorrencia={selectedOcorrencia}
        onClose={closeEditModal}
        onSave={handleSaveEdit}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </MainLayout>
  );
}
