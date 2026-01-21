'use client';

/**
 * Página de gerenciamento de usuários.
 * Acesso: coordenador+ (view), administrador (CRUD completo)
 */

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { Add as AddIcon, AdminPanelSettings } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { ConfirmDialog } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { Usuario } from '@/types';
import { useUsuariosLoader, useUsuariosActions } from './hooks';
import { UsuarioFilters, UsuarioTable, UsuarioFormModal } from './components';

export default function UsuariosPage() {
  const { can } = usePermissions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Usuario | null>(null);

  const {
    usuarios,
    turmas,
    disciplinas,
    loading,
    error,
    filters,
    setFilters,
    stats,
    reload,
  } = useUsuariosLoader();

  const {
    createUsuario,
    updateUsuario,
    deleteUsuario,
    toggleAtivo,
    resetVinculacao,
    saving,
    deleting,
  } = useUsuariosActions(reload);

  // Permissões
  const canView = can('usuarios:view');
  const canCreate = can('usuarios:create');
  const canEdit = can('usuarios:edit');
  const canDelete = can('usuarios:delete');

  if (!canView) {
    return (
      <MainLayout>
        <Box sx={{ p: 4 }}>
          <Alert severity="error">
            Você não tem permissão para acessar esta página.
          </Alert>
        </Box>
      </MainLayout>
    );
  }

  const handleOpenModal = (usuario?: Usuario) => {
    setEditingUsuario(usuario || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUsuario(null);
  };

  const handleSubmit = async (data: Parameters<typeof createUsuario>[0]) => {
    if (editingUsuario) {
      return updateUsuario(editingUsuario.id, data);
    }
    return createUsuario(data);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteUsuario(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminPanelSettings color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Gerenciamento de Usuários
            </Typography>
          </Box>

          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal()}
            >
              Novo Usuário
            </Button>
          )}
        </Box>

        {/* Erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <UsuarioFilters
            filters={filters}
            onChange={setFilters}
            stats={stats}
          />
        </Paper>

        {/* Tabela */}
        <UsuarioTable
          usuarios={usuarios}
          loading={loading}
          onEdit={handleOpenModal}
          onDelete={setDeleteConfirm}
          onToggleAtivo={toggleAtivo}
          onResetVinculacao={(usuario) => resetVinculacao(usuario.id)}
          canEdit={canEdit}
          canDelete={canDelete}
        />

        {/* Modal de Formulário */}
        <UsuarioFormModal
          open={modalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          usuario={editingUsuario}
          turmas={turmas}
          disciplinas={disciplinas}
          saving={saving}
        />

        {/* Diálogo de Confirmação de Exclusão */}
        <ConfirmDialog
          open={Boolean(deleteConfirm)}
          title="Excluir Usuário"
          message={`Tem certeza que deseja excluir o usuário "${deleteConfirm?.nome}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          confirmColor="error"
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm(null)}
        />
      </Box>
    </MainLayout>
  );
}
