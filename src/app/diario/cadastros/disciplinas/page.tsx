'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { Add, Edit, Delete, MenuBook } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { DataTable, ConfirmDialog, FormModal } from '@/components/ui';
import { useUIStore } from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useModal } from '@/hooks/useModal';
import { disciplinaService, turmaService } from '@/services/firestore';
import { Disciplina, Turma } from '@/types';

interface DisciplinaForm {
  nome: string;
  codigo: string;
  turmaIds: string[];
}

const initialForm: DisciplinaForm = {
  nome: '',
  codigo: '',
  turmaIds: [],
};

export default function DisciplinasPage() {
  const { addToast } = useUIStore();
  const { hasMinRole } = usePermissions();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DisciplinaForm>(initialForm);

  // Hooks de modal
  const formModal = useModal<Disciplina>();
  const deleteModal = useModal<Disciplina>();

  const canAccess = hasMinRole('coordenador');

  useEffect(() => {
    if (canAccess) {
      loadData();
    }
  }, [canAccess]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [disciplinasData, turmasData] = await Promise.all([
        disciplinaService.getAll(),
        turmaService.getAll(),
      ]);
      setDisciplinas(disciplinasData);
      setTurmas(turmasData.filter(t => t.ativo));
    } catch (error) {
      console.error('Error loading data:', error);
      addToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (disciplina?: Disciplina) => {
    if (disciplina) {
      setForm({
        nome: disciplina.nome,
        codigo: disciplina.codigo || '',
        turmaIds: disciplina.turmaIds || [],
      });
      formModal.open(disciplina);
    } else {
      setForm(initialForm);
      formModal.open();
    }
  };

  const handleCloseModal = () => {
    formModal.close();
    setForm(initialForm);
  };

  const handleSave = async () => {
    if (!form.nome) {
      addToast('Preencha o nome da disciplina', 'error');
      return;
    }

    if (form.turmaIds.length === 0) {
      addToast('Selecione pelo menos uma turma', 'error');
      return;
    }

    setSaving(true);
    try {
      const disciplinaData = {
        nome: form.nome,
        codigo: form.codigo || undefined,
        turmaIds: form.turmaIds,
        ativo: true,
      };

      if (formModal.data) {
        await disciplinaService.update(formModal.data.id, disciplinaData);
        addToast('Disciplina atualizada com sucesso!', 'success');
      } else {
        await disciplinaService.create(disciplinaData);
        addToast('Disciplina criada com sucesso!', 'success');
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error saving disciplina:', error);
      addToast('Erro ao salvar disciplina', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.data) return;

    try {
      await disciplinaService.update(deleteModal.data.id, { ativo: false });
      addToast('Disciplina desativada com sucesso!', 'success');
      deleteModal.close();
      loadData();
    } catch (error) {
      console.error('Error deleting disciplina:', error);
      addToast('Erro ao desativar disciplina', 'error');
    }
  };

  const getTurmasChips = (turmaIds: string[] | undefined) => {
    if (!turmaIds || turmaIds.length === 0) {
      return <Chip label="Sem turmas" size="small" color="warning" />;
    }

    if (turmaIds.length <= 2) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {turmaIds.map(id => {
            const turma = turmas.find(t => t.id === id);
            return turma ? (
              <Chip key={id} label={turma.nome} size="small" />
            ) : null;
          })}
        </Box>
      );
    }

    return <Chip label={`${turmaIds.length} turmas`} size="small" color="primary" />;
  };

  // Colunas para o DataTable
  const columns = useMemo(() => [
    {
      id: 'nome' as const,
      label: 'Nome',
      format: (value: string) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MenuBook color="primary" />
          <Typography fontWeight={500}>{value}</Typography>
        </Box>
      ),
    },
    {
      id: 'codigo' as const,
      label: 'Codigo',
      format: (value: string | undefined) => value || '-',
    },
    {
      id: 'turmaIds' as const,
      label: 'Turmas Vinculadas',
      format: (value: string[] | undefined) => getTurmasChips(value),
    },
    {
      id: 'ativo' as const,
      label: 'Status',
      format: (value: boolean) => (
        <Chip
          label={value ? 'Ativa' : 'Inativa'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
  ], [turmas]);

  // Acoes do DataTable
  const actions = useMemo(() => [
    {
      icon: <Edit fontSize="small" />,
      label: 'Editar',
      onClick: (disciplina: Disciplina) => handleOpenModal(disciplina),
    },
    {
      icon: <Delete fontSize="small" />,
      label: 'Desativar',
      color: 'error' as const,
      onClick: (disciplina: Disciplina) => deleteModal.open(disciplina),
    },
  ], []);

  if (!canAccess) {
    return (
      <MainLayout title="Disciplinas" showSidebar>
        <Alert severity="error">
          Voce nao tem permissao para acessar esta pagina.
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Cadastro de Disciplinas" showSidebar>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            Disciplinas
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
            sx={{ textTransform: 'none' }}
          >
            Nova Disciplina
          </Button>
        </Box>

        {/* Table ou Empty State */}
        {!loading && disciplinas.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <MenuBook sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhuma disciplina cadastrada
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => handleOpenModal()}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Cadastrar primeira disciplina
            </Button>
          </Paper>
        ) : (
          <DataTable
            columns={columns}
            data={disciplinas}
            actions={actions}
            loading={loading}
            rowKey="id"
            emptyMessage="Nenhuma disciplina encontrada"
          />
        )}

        {/* Stats */}
        {!loading && disciplinas.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Chip label={`Total: ${disciplinas.length} disciplinas`} variant="outlined" />
            <Chip label={`Ativas: ${disciplinas.filter(d => d.ativo).length}`} color="success" variant="outlined" />
          </Box>
        )}
      </Box>

      {/* Add/Edit Modal */}
      <FormModal
        open={formModal.isOpen}
        onClose={handleCloseModal}
        title={formModal.data ? 'Editar Disciplina' : 'Nova Disciplina'}
        onSubmit={handleSave}
        submitLabel={saving ? 'Salvando...' : 'Salvar'}
        loading={saving || turmas.length === 0}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nome da Disciplina"
            value={form.nome}
            onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
            fullWidth
            required
            placeholder="Ex: Matematica"
          />

          <TextField
            label="Codigo"
            value={form.codigo}
            onChange={(e) => setForm(prev => ({ ...prev, codigo: e.target.value }))}
            fullWidth
            placeholder="Ex: MAT001"
            helperText="Opcional - codigo interno da disciplina"
          />

          <FormControl fullWidth required>
            <InputLabel>Turmas Vinculadas</InputLabel>
            <Select
              multiple
              value={form.turmaIds}
              onChange={(e) => setForm(prev => ({ ...prev, turmaIds: e.target.value as string[] }))}
              input={<OutlinedInput label="Turmas Vinculadas" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((id) => {
                    const turma = turmas.find(t => t.id === id);
                    return turma ? (
                      <Chip key={id} label={turma.nome} size="small" />
                    ) : null;
                  })}
                </Box>
              )}
            >
              {turmas.map((turma) => (
                <MenuItem key={turma.id} value={turma.id}>
                  <Checkbox checked={form.turmaIds.includes(turma.id)} />
                  <ListItemText primary={turma.nome} />
                </MenuItem>
              ))}
            </Select>
            {turmas.length === 0 && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                Cadastre turmas primeiro para vincular a disciplina
              </Typography>
            )}
            {turmas.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Selecione as turmas onde esta disciplina sera ministrada
              </Typography>
            )}
          </FormControl>

          {/* Quick select buttons */}
          {turmas.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setForm(prev => ({ ...prev, turmaIds: turmas.map(t => t.id) }))}
                sx={{ textTransform: 'none' }}
              >
                Selecionar todas
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => setForm(prev => ({ ...prev, turmaIds: [] }))}
                sx={{ textTransform: 'none' }}
              >
                Limpar selecao
              </Button>
            </Box>
          )}
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="Confirmar Desativacao"
        message={`Tem certeza que deseja desativar a disciplina "${deleteModal.data?.nome}"?`}
        confirmLabel="Desativar"
        confirmColor="error"
      />
    </MainLayout>
  );
}
