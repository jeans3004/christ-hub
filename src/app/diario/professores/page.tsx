'use client';

/**
 * Pagina de cadastro de professores com integracao Google Auth.
 */

import { useMemo } from 'react';
import { Box, Typography, Chip, Alert, Tooltip, Stack } from '@mui/material';
import { Edit, PersonOff, PersonAdd } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { DataTable, ConfirmDialog, FormModal } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { Usuario } from '@/types';
import { useProfessoresPage } from './hooks';
import { FilterBar, ProfessorFormContent, ConselheiroManager } from './components';
import { ProfessorTableRow } from './types';

export default function ProfessoresPage() {
  const { hasMinRole } = usePermissions();
  const canAccess = hasMinRole('coordenador');

  const {
    professores,
    professoresTable,
    disciplinas,
    turmas,
    loading,
    filtro,
    setFiltro,
    reload,
    form,
    setForm,
    saving,
    formModal,
    deleteModal,
    handleOpenModal,
    handleCloseModal,
    handleSave,
    handleToggleStatus,
  } = useProfessoresPage();

  const columns = useMemo(() => [
    {
      id: 'nome' as const,
      label: 'Nome',
      minWidth: 180,
    },
    {
      id: 'googleEmail' as const,
      label: 'E-mail',
      minWidth: 200,
      format: (value: string | undefined, row: ProfessorTableRow) => value || row.email || '-',
    },
    {
      id: 'tipo' as const,
      label: 'Papel',
      minWidth: 100,
      format: (value: string) => (
        <Chip
          label={value === 'coordenador' ? 'Coordenador' : 'Professor'}
          size="small"
          color={value === 'coordenador' ? 'warning' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      id: 'disciplinasNomes' as const,
      label: 'Disciplinas',
      minWidth: 200,
      format: (value: string[]) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {value.length === 0 ? (
            <Typography variant="caption" color="text.secondary">-</Typography>
          ) : value.length <= 2 ? (
            value.map((nome, i) => (
              <Chip key={i} label={nome} size="small" variant="outlined" />
            ))
          ) : (
            <>
              <Chip label={value[0]} size="small" variant="outlined" />
              <Tooltip title={value.slice(1).join(', ')}>
                <Chip label={`+${value.length - 1}`} size="small" color="primary" />
              </Tooltip>
            </>
          )}
        </Stack>
      ),
    },
    {
      id: 'turmasNomes' as const,
      label: 'Turmas',
      minWidth: 150,
      format: (value: string[]) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {value.length === 0 ? (
            <Typography variant="caption" color="text.secondary">-</Typography>
          ) : value.length <= 2 ? (
            value.map((nome, i) => (
              <Chip key={i} label={nome} size="small" variant="outlined" color="primary" />
            ))
          ) : (
            <>
              <Chip label={value[0]} size="small" variant="outlined" color="primary" />
              <Tooltip title={value.slice(1).join(', ')}>
                <Chip label={`+${value.length - 1}`} size="small" color="primary" />
              </Tooltip>
            </>
          )}
        </Stack>
      ),
    },
    {
      id: 'statusLabel' as const,
      label: 'Status',
      minWidth: 140,
      format: (value: string, row: ProfessorTableRow) => (
        <Chip
          label={value}
          size="small"
          color={row.statusColor}
          icon={row.statusColor === 'warning' ? <PersonAdd fontSize="small" /> : undefined}
        />
      ),
    },
  ], []);

  const actions = useMemo(() => [
    {
      icon: <Edit fontSize="small" />,
      label: 'Editar',
      onClick: (professor: ProfessorTableRow) => handleOpenModal(professor),
    },
    {
      icon: <PersonOff fontSize="small" />,
      label: 'Desativar',
      color: 'error' as const,
      onClick: (professor: ProfessorTableRow) => deleteModal.open(professor),
      hidden: (professor: ProfessorTableRow) => !professor.ativo,
    },
    {
      icon: <PersonAdd fontSize="small" />,
      label: 'Ativar',
      color: 'success' as const,
      onClick: (professor: ProfessorTableRow) => handleToggleStatus(professor),
      hidden: (professor: ProfessorTableRow) => professor.ativo,
    },
  ], [handleOpenModal, deleteModal, handleToggleStatus]);

  if (!canAccess) {
    return (
      <MainLayout title="Professores" showSidebar>
        <Alert severity="error">Voce nao tem permissao para acessar esta pagina.</Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Cadastro de Professores" showSidebar>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={600}>Professores</Typography>
        </Box>

        <FilterBar
          filtro={filtro}
          onFiltroChange={setFiltro}
          onAddClick={() => handleOpenModal()}
        />

        <DataTable
          columns={columns}
          data={professoresTable}
          actions={actions}
          loading={loading}
          rowKey="id"
          emptyMessage="Nenhum professor encontrado"
        />

        <ConselheiroManager
          professores={professores}
          turmas={turmas}
          loading={loading}
          onReload={reload}
        />
      </Box>

      <FormModal
        open={formModal.isOpen}
        onClose={handleCloseModal}
        title={formModal.data ? 'Editar Professor' : 'Novo Professor'}
        onSubmit={handleSave}
        submitLabel={saving ? 'Salvando...' : 'Salvar'}
        loading={saving}
        maxWidth="sm"
      >
        <ProfessorFormContent
          form={form}
          setForm={setForm}
          isEditing={!!formModal.data}
        />
      </FormModal>

      <ConfirmDialog
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={() => deleteModal.data && handleToggleStatus(deleteModal.data)}
        title="Confirmar Desativacao"
        message={`Tem certeza que deseja desativar o professor "${deleteModal.data?.nome}"? Ele nao podera mais acessar o sistema.`}
        confirmLabel="Desativar"
        confirmColor="error"
      />
    </MainLayout>
  );
}
