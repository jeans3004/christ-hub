'use client';

/**
 * Pagina de cadastro de turmas.
 */

import { useMemo } from 'react';
import { Box, Button, Typography, Chip, Alert } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { DataTable, ConfirmDialog, FormModal } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { Turma } from '@/types';
import { useTurmasPage } from './hooks';
import { TurmaFormContent, EmptyState } from './components';

export default function TurmasPage() {
  const { hasMinRole } = usePermissions();
  const canAccess = hasMinRole('coordenador');

  const {
    turmas,
    loading,
    saving,
    form,
    setForm,
    formModal,
    deleteModal,
    handleOpenModal,
    handleCloseModal,
    handleSave,
    handleDelete,
  } = useTurmasPage(canAccess);

  const columns = useMemo(() => [
    { id: 'nome' as const, label: 'Nome' },
    { id: 'serie' as const, label: 'Serie' },
    { id: 'turno' as const, label: 'Turno' },
    { id: 'ano' as const, label: 'Ano' },
    {
      id: 'ativo' as const,
      label: 'Status',
      format: (value: boolean) => (
        <Chip label={value ? 'Ativo' : 'Inativo'} color={value ? 'success' : 'default'} size="small" />
      ),
    },
  ], []);

  const actions = useMemo(() => [
    {
      icon: <Edit fontSize="small" />,
      label: 'Editar',
      onClick: (turma: Turma) => handleOpenModal(turma),
    },
    {
      icon: <Delete fontSize="small" />,
      label: 'Desativar',
      color: 'error' as const,
      onClick: (turma: Turma) => deleteModal.open(turma),
    },
  ], [handleOpenModal, deleteModal]);

  if (!canAccess) {
    return (
      <MainLayout title="Turmas" showSidebar>
        <Alert severity="error">Voce nao tem permissao para acessar esta pagina.</Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Cadastro de Turmas" showSidebar>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>Turmas</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenModal()} sx={{ textTransform: 'none' }}>
            Nova Turma
          </Button>
        </Box>

        {!loading && turmas.length === 0 ? (
          <EmptyState onAdd={() => handleOpenModal()} />
        ) : (
          <DataTable
            columns={columns}
            data={turmas}
            actions={actions}
            loading={loading}
            rowKey="id"
            emptyMessage="Nenhuma turma encontrada"
          />
        )}
      </Box>

      <FormModal
        open={formModal.isOpen}
        onClose={handleCloseModal}
        title={formModal.data ? 'Editar Turma' : 'Nova Turma'}
        onSubmit={handleSave}
        submitLabel={saving ? 'Salvando...' : 'Salvar'}
        loading={saving}
      >
        <TurmaFormContent form={form} setForm={setForm} />
      </FormModal>

      <ConfirmDialog
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="Confirmar Desativacao"
        message={`Tem certeza que deseja desativar a turma "${deleteModal.data?.nome}"?`}
        confirmLabel="Desativar"
        confirmColor="error"
      />
    </MainLayout>
  );
}
