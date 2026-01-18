'use client';

/**
 * Pagina de cadastro de alunos.
 */

import { useMemo } from 'react';
import { Box, Button, Typography, Chip, Alert, Avatar, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { DataTable, ConfirmDialog, FormModal } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { Aluno } from '@/types';
import { useAlunosPage } from './hooks';
import { AlunoFormContent, EmptyState } from './components';
import { avatarColors } from './types';

export default function AlunosPage() {
  const { hasMinRole } = usePermissions();
  const canAccess = hasMinRole('coordenador');

  const {
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
  } = useAlunosPage(canAccess);

  const columns = useMemo(() => [
    {
      id: 'nome' as const,
      label: 'Aluno',
      format: (value: string, row: Aluno) => {
        const index = alunos.findIndex(a => a.id === row.id);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: avatarColors[index % avatarColors.length], width: 36, height: 36 }}>
              {value.charAt(0)}
            </Avatar>
            <Box>
              <Typography fontWeight={500}>{value}</Typography>
              {row.cpf && (
                <Typography variant="caption" color="text.secondary">CPF: {row.cpf}</Typography>
              )}
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'matricula' as const,
      label: 'Matricula',
      format: (value: string | undefined) => value || '-',
    },
    {
      id: 'turmaId' as const,
      label: 'Turma',
      format: (value: string) => getTurmaNome(value),
    },
    {
      id: 'ativo' as const,
      label: 'Status',
      format: (value: boolean) => (
        <Chip label={value ? 'Ativo' : 'Inativo'} color={value ? 'success' : 'default'} size="small" />
      ),
    },
  ], [alunos, getTurmaNome]);

  const actions = useMemo(() => [
    {
      icon: <Edit fontSize="small" />,
      label: 'Editar',
      onClick: (aluno: Aluno) => handleOpenModal(aluno),
    },
    {
      icon: <Delete fontSize="small" />,
      label: 'Desativar',
      color: 'error' as const,
      onClick: (aluno: Aluno) => deleteModal.open(aluno),
    },
  ], [handleOpenModal, deleteModal]);

  if (!canAccess) {
    return (
      <MainLayout title="Alunos" showSidebar>
        <Alert severity="error">Voce nao tem permissao para acessar esta pagina.</Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Cadastro de Alunos" showSidebar>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" fontWeight={600}>Alunos</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Turma</InputLabel>
              <Select value={filterTurmaId} label="Filtrar por Turma" onChange={(e) => setFilterTurmaId(e.target.value)}>
                <MenuItem value="">Todas as turmas</MenuItem>
                {turmas.map((turma) => (
                  <MenuItem key={turma.id} value={turma.id}>{turma.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenModal()} sx={{ textTransform: 'none' }}>
              Novo Aluno
            </Button>
          </Box>
        </Box>

        {/* Table ou Empty State */}
        {!loading && filteredAlunos.length === 0 ? (
          <EmptyState filtered={!!filterTurmaId} onAdd={() => handleOpenModal()} />
        ) : (
          <DataTable
            columns={columns}
            data={filteredAlunos}
            actions={actions}
            loading={loading}
            rowKey="id"
            emptyMessage="Nenhum aluno encontrado"
          />
        )}

        {/* Stats */}
        {!loading && filteredAlunos.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Chip label={`Total: ${filteredAlunos.length} alunos`} variant="outlined" />
            <Chip label={`Ativos: ${filteredAlunos.filter(a => a.ativo).length}`} color="success" variant="outlined" />
          </Box>
        )}
      </Box>

      {/* Add/Edit Modal */}
      <FormModal
        open={formModal.isOpen}
        onClose={handleCloseModal}
        title={formModal.data ? 'Editar Aluno' : 'Novo Aluno'}
        onSubmit={handleSave}
        submitLabel={saving ? 'Salvando...' : 'Salvar'}
        loading={saving}
      >
        <AlunoFormContent form={form} setForm={setForm} turmas={turmas} />
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="Confirmar Desativacao"
        message={`Tem certeza que deseja desativar o aluno "${deleteModal.data?.nome}"?`}
        confirmLabel="Desativar"
        confirmColor="error"
      />
    </MainLayout>
  );
}
