'use client';

/**
 * Pagina de professores.
 */

import { Box } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import DataTable from '@/components/ui/DataTable';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Professor } from '@/types';
import { useProfessoresPage } from './hooks';
import { FilterBar, ProfessorFormContent, DisciplinasTable } from './components';

export default function ProfessoresPage() {
  const {
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
  } = useProfessoresPage();

  const columns = [
    { id: 'nome', label: 'Nome', minWidth: 200 },
    { id: 'cpf', label: 'CPF', minWidth: 130 },
    { id: 'telefone', label: 'Telefone', minWidth: 130 },
    {
      id: 'coordenador',
      label: 'Coordenador',
      minWidth: 100,
      format: (value: boolean) => value ? 'Sim' : 'Não',
    },
    {
      id: 'disciplinas',
      label: 'Professor',
      minWidth: 100,
      format: (value: string[]) => value.length > 0 ? 'Sim' : 'Não',
    },
  ];

  const actions = [
    {
      icon: <Edit />,
      label: 'Editar',
      onClick: (professor: Professor) => handleOpenModal(professor),
      color: 'primary' as const,
    },
    {
      icon: <Delete />,
      label: 'Excluir',
      onClick: (professor: Professor) => setDeleteDialog({ open: true, id: professor.id }),
      color: 'error' as const,
    },
  ];

  return (
    <MainLayout title="Professores">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FilterBar
          filtro={filtro}
          onFiltroChange={handleFiltroChange}
          onAddClick={() => handleOpenModal()}
        />

        <DisciplinasTable professor={editingProfessor} />

        <DataTable
          columns={columns}
          data={filteredProfessores}
          actions={actions}
          rowKey="id"
          emptyMessage="Nenhum professor encontrado"
        />
      </Box>

      <FormModal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingProfessor ? 'Editar Professor(a)' : 'Cadastro do(a) Professor(a)'}
        onSubmit={handleSave}
      >
        <ProfessorFormContent
          formData={formData}
          onFormChange={handleFormChange}
          onDisciplinaToggle={handleDisciplinaToggle}
        />
      </FormModal>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: '' })}
        onConfirm={() => handleDelete(deleteDialog.id)}
        title="Excluir Professor"
        message="Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        confirmColor="error"
      />
    </MainLayout>
  );
}
