'use client';

/**
 * Página de gerenciamento de usuários.
 * Acesso: coordenador+ (view), administrador (CRUD completo)
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, AdminPanelSettings, MergeType } from '@mui/icons-material';
import { useUIStore } from '@/store/uiStore';
import MainLayout from '@/components/layout/MainLayout';
import { ConfirmDialog } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { Usuario } from '@/types';
import { useUsuariosLoader, useUsuariosActions } from './hooks';
import { UsuarioFilters, UsuarioTable, UsuarioFormModal } from './components';

export default function UsuariosPage() {
  const { can } = usePermissions();
  const { addToast } = useUIStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Usuario | null>(null);
  const [merging, setMerging] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState<number | null>(null);

  const checkDuplicates = async () => {
    try {
      const response = await fetch('/api/usuarios/duplicates');
      const data = await response.json();
      if (data.success) {
        const byName = data.duplicates.filter((d: any) => d.field === 'nome');
        setDuplicateCount(byName.length);
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
    }
  };

  const handleMerge = async () => {
    setMerging(true);
    try {
      const response = await fetch('/api/usuarios/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoMergeAll: true }),
      });
      const data = await response.json();
      if (data.success) {
        addToast(`Merge concluído! ${data.totalDeleted} duplicados removidos.`, 'success');
        setDuplicateCount(0);
        reload();
      } else {
        addToast(data.error || 'Erro ao fazer merge', 'error');
      }
    } catch (error) {
      console.error('Error merging:', error);
      addToast('Erro ao fazer merge', 'error');
    } finally {
      setMerging(false);
    }
  };

  useEffect(() => {
    checkDuplicates();
  }, []);

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

          {/* Seção de Merge */}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Gerenciar Duplicados
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {duplicateCount === null
                  ? 'Verificando...'
                  : duplicateCount === 0
                  ? 'Nenhum duplicado encontrado'
                  : `${duplicateCount} duplicado(s) encontrado(s)`}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={checkDuplicates}
                disabled={merging}
              >
                Verificar
              </Button>
              {duplicateCount !== null && duplicateCount > 0 && (
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  startIcon={merging ? <CircularProgress size={16} color="inherit" /> : <MergeType />}
                  onClick={handleMerge}
                  disabled={merging}
                >
                  {merging ? 'Mesclando...' : 'Mesclar'}
                </Button>
              )}
            </Box>
          </Box>
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
