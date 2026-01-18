'use client';

/**
 * Pagina de cadastro de disciplinas com hierarquia.
 */

import { useState } from 'react';
import { Box, Button, Typography, Chip, Alert, ToggleButtonGroup, ToggleButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { Add, AccountTree, TableChart } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { FormModal } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { useDisciplinasPage } from './hooks';
import { DisciplinaTreeView, DisciplinaFormContent, EmptyState } from './components';
import { ViewMode, DeleteChildrenAction, DisciplinaNode } from './types';

export default function DisciplinasPage() {
  const { hasMinRole } = usePermissions();
  const canAccess = hasMinRole('coordenador');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [deleteAction, setDeleteAction] = useState<DeleteChildrenAction>('move_to_root');

  const {
    disciplinas,
    turmas,
    tree,
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
    handleAddChild,
    getAvailableParents,
    getFullPath,
    canHaveChildren,
  } = useDisciplinasPage(canAccess);

  if (!canAccess) {
    return (
      <MainLayout title="Disciplinas" showSidebar>
        <Alert severity="error">Voce nao tem permissao para acessar esta pagina.</Alert>
      </MainLayout>
    );
  }

  const handleEditNode = (node: DisciplinaNode) => {
    handleOpenModal(node);
  };

  const handleDeleteNode = (node: DisciplinaNode) => {
    deleteModal.open(node);
  };

  const availableParents = getAvailableParents(formModal.data?.id);

  return (
    <MainLayout title="Cadastro de Disciplinas" showSidebar>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={600}>Disciplinas</Typography>
            <Typography variant="body2" color="text.secondary">
              Organize disciplinas em hierarquia (ate 3 niveis)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setViewMode(v)}
              size="small"
            >
              <ToggleButton value="tree">
                <AccountTree sx={{ mr: 0.5 }} fontSize="small" />
                Arvore
              </ToggleButton>
              <ToggleButton value="table">
                <TableChart sx={{ mr: 0.5 }} fontSize="small" />
                Lista
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenModal()}
              sx={{ textTransform: 'none' }}
            >
              Nova Disciplina
            </Button>
          </Box>
        </Box>

        {/* Content */}
        {!loading && disciplinas.length === 0 ? (
          <EmptyState onAdd={() => handleOpenModal()} />
        ) : viewMode === 'tree' ? (
          <DisciplinaTreeView
            tree={tree}
            loading={loading}
            canHaveChildren={canHaveChildren}
            onEdit={handleEditNode}
            onAddChild={handleAddChild}
            onDelete={handleDeleteNode}
          />
        ) : (
          // Fallback para lista simples (DataTable original)
          <DisciplinaTreeView
            tree={tree}
            loading={loading}
            canHaveChildren={canHaveChildren}
            onEdit={handleEditNode}
            onAddChild={handleAddChild}
            onDelete={handleDeleteNode}
          />
        )}

        {/* Stats */}
        {!loading && disciplinas.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Chip label={`Total: ${disciplinas.length}`} variant="outlined" />
            <Chip label={`Raiz: ${tree.length}`} variant="outlined" color="primary" />
            <Chip label={`Ativas: ${disciplinas.filter(d => d.ativo).length}`} color="success" variant="outlined" />
          </Box>
        )}
      </Box>

      {/* Add/Edit Modal */}
      <FormModal
        open={formModal.isOpen}
        onClose={handleCloseModal}
        title={formModal.data ? 'Editar Disciplina' : (form.parentId ? 'Nova Subdisciplina' : 'Nova Disciplina')}
        onSubmit={handleSave}
        submitLabel={saving ? 'Salvando...' : 'Salvar'}
        loading={saving || turmas.length === 0}
      >
        <DisciplinaFormContent
          form={form}
          setForm={setForm}
          turmas={turmas}
          availableParents={availableParents}
          getFullPath={getFullPath}
          editingId={formModal.data?.id}
        />
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModal.isOpen} onClose={deleteModal.close} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar Desativacao</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Tem certeza que deseja desativar a disciplina <strong>{deleteModal.data?.nome}</strong>?
          </Typography>

          {deleteModal.data?.hasChildren && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                Esta disciplina possui {deleteModal.data.children.length} subdisciplina(s)
              </Typography>
              <RadioGroup value={deleteAction} onChange={(e) => setDeleteAction(e.target.value as DeleteChildrenAction)}>
                <FormControlLabel
                  value="move_to_root"
                  control={<Radio size="small" />}
                  label="Mover subdisciplinas para a raiz"
                />
                <FormControlLabel
                  value="delete_all"
                  control={<Radio size="small" />}
                  label="Desativar todas as subdisciplinas tambem"
                />
              </RadioGroup>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteModal.close}>Cancelar</Button>
          <Button onClick={() => handleDelete(deleteAction)} color="error" variant="contained">
            Desativar
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
