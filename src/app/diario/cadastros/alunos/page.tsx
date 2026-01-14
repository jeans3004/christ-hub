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
  Avatar,
} from '@mui/material';
import { Add, Edit, Delete, Person } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { DataTable, ConfirmDialog, FormModal } from '@/components/ui';
import { useUIStore } from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useModal } from '@/hooks/useModal';
import { alunoService, turmaService } from '@/services/firestore';
import { Aluno, Turma } from '@/types';

interface AlunoForm {
  nome: string;
  cpf: string;
  dataNascimento: string;
  turmaId: string;
  matricula: string;
}

const initialForm: AlunoForm = {
  nome: '',
  cpf: '',
  dataNascimento: '',
  turmaId: '',
  matricula: '',
};

const avatarColors = [
  '#4CAF50', '#2196F3', '#9C27B0', '#FF9800',
  '#E91E63', '#00BCD4', '#FF5722', '#3F51B5',
];

export default function AlunosPage() {
  const { addToast } = useUIStore();
  const { hasMinRole } = usePermissions();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterTurmaId, setFilterTurmaId] = useState<string>('');

  // Hooks de modal
  const formModal = useModal<Aluno>();
  const deleteModal = useModal<Aluno>();

  // State do formulario
  const [form, setForm] = useState<AlunoForm>(initialForm);

  const canAccess = hasMinRole('coordenador');

  useEffect(() => {
    if (canAccess) {
      loadData();
    }
  }, [canAccess]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alunosData, turmasData] = await Promise.all([
        alunoService.getAll(),
        turmaService.getAll(),
      ]);
      setAlunos(alunosData);
      setTurmas(turmasData.filter(t => t.ativo));
    } catch (error) {
      console.error('Error loading data:', error);
      addToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (aluno?: Aluno) => {
    if (aluno) {
      setForm({
        nome: aluno.nome,
        cpf: aluno.cpf || '',
        dataNascimento: aluno.dataNascimento
          ? new Date(aluno.dataNascimento).toISOString().split('T')[0]
          : '',
        turmaId: aluno.turmaId,
        matricula: aluno.matricula || '',
      });
      formModal.open(aluno);
    } else {
      setForm({ ...initialForm, turmaId: filterTurmaId });
      formModal.open();
    }
  };

  const handleCloseModal = () => {
    formModal.close();
    setForm(initialForm);
  };

  const handleSave = async () => {
    if (!form.nome || !form.turmaId) {
      addToast('Preencha nome e turma', 'error');
      return;
    }

    setSaving(true);
    try {
      const alunoData = {
        nome: form.nome,
        cpf: form.cpf || undefined,
        dataNascimento: form.dataNascimento ? new Date(form.dataNascimento) : undefined,
        turmaId: form.turmaId,
        matricula: form.matricula || undefined,
        ativo: true,
      };

      if (formModal.data) {
        await alunoService.update(formModal.data.id, alunoData);
        addToast('Aluno atualizado com sucesso!', 'success');
      } else {
        await alunoService.create(alunoData);
        addToast('Aluno cadastrado com sucesso!', 'success');
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error saving aluno:', error);
      addToast('Erro ao salvar aluno', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.data) return;

    try {
      await alunoService.update(deleteModal.data.id, { ativo: false });
      addToast('Aluno desativado com sucesso!', 'success');
      deleteModal.close();
      loadData();
    } catch (error) {
      console.error('Error deleting aluno:', error);
      addToast('Erro ao desativar aluno', 'error');
    }
  };

  const getTurmaNome = (turmaId: string) => {
    const turma = turmas.find(t => t.id === turmaId);
    return turma?.nome || '-';
  };

  const filteredAlunos = filterTurmaId
    ? alunos.filter(a => a.turmaId === filterTurmaId)
    : alunos;

  // Colunas para o DataTable
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
                <Typography variant="caption" color="text.secondary">
                  CPF: {row.cpf}
                </Typography>
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
        <Chip
          label={value ? 'Ativo' : 'Inativo'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
  ], [alunos, turmas]);

  // Acoes do DataTable
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
  ], []);

  if (!canAccess) {
    return (
      <MainLayout title="Alunos" showSidebar>
        <Alert severity="error">
          Voce nao tem permissao para acessar esta pagina.
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Cadastro de Alunos" showSidebar>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            Alunos
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Turma</InputLabel>
              <Select
                value={filterTurmaId}
                label="Filtrar por Turma"
                onChange={(e) => setFilterTurmaId(e.target.value)}
              >
                <MenuItem value="">Todas as turmas</MenuItem>
                {turmas.map((turma) => (
                  <MenuItem key={turma.id} value={turma.id}>{turma.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenModal()}
              sx={{ textTransform: 'none' }}
            >
              Novo Aluno
            </Button>
          </Box>
        </Box>

        {/* Table ou Empty State */}
        {!loading && filteredAlunos.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {filterTurmaId ? 'Nenhum aluno nesta turma' : 'Nenhum aluno cadastrado'}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => handleOpenModal()}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Cadastrar aluno
            </Button>
          </Paper>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nome Completo"
            value={form.nome}
            onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
            fullWidth
            required
          />

          <FormControl fullWidth required>
            <InputLabel>Turma</InputLabel>
            <Select
              value={form.turmaId}
              label="Turma"
              onChange={(e) => setForm(prev => ({ ...prev, turmaId: e.target.value }))}
            >
              {turmas.map((turma) => (
                <MenuItem key={turma.id} value={turma.id}>{turma.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Matricula"
            value={form.matricula}
            onChange={(e) => setForm(prev => ({ ...prev, matricula: e.target.value }))}
            fullWidth
          />

          <TextField
            label="CPF"
            value={form.cpf}
            onChange={(e) => setForm(prev => ({ ...prev, cpf: e.target.value }))}
            fullWidth
            placeholder="000.000.000-00"
          />

          <TextField
            label="Data de Nascimento"
            type="date"
            value={form.dataNascimento}
            onChange={(e) => setForm(prev => ({ ...prev, dataNascimento: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>
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
