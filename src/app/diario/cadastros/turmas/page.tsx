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
} from '@mui/material';
import { Add, Edit, Delete, School } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { DataTable, ConfirmDialog, FormModal } from '@/components/ui';
import { useUIStore } from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useModal } from '@/hooks/useModal';
import { turmaService } from '@/services/firestore';
import { Turma, Turno } from '@/types';

const turnos: Turno[] = ['Matutino', 'Vespertino', 'Noturno'];

const series = [
  '6o Ano - Ensino Fundamental II',
  '7o Ano - Ensino Fundamental II',
  '8o Ano - Ensino Fundamental II',
  '9o Ano - Ensino Fundamental II',
  '1a Serie - Ensino Medio',
  '2a Serie - Ensino Medio',
  '3a Serie - Ensino Medio',
];

interface TurmaForm {
  nome: string;
  serie: string;
  turno: Turno;
  ano: number;
}

const initialForm: TurmaForm = {
  nome: '',
  serie: '',
  turno: 'Matutino',
  ano: new Date().getFullYear(),
};

export default function TurmasPage() {
  const { addToast } = useUIStore();
  const { hasMinRole } = usePermissions();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TurmaForm>(initialForm);

  // Hooks de modal
  const formModal = useModal<Turma>();
  const deleteModal = useModal<Turma>();

  const canAccess = hasMinRole('coordenador');

  useEffect(() => {
    if (canAccess) {
      loadTurmas();
    }
  }, [canAccess]);

  const loadTurmas = async () => {
    setLoading(true);
    try {
      const data = await turmaService.getAll();
      setTurmas(data);
    } catch (error) {
      console.error('Error loading turmas:', error);
      addToast('Erro ao carregar turmas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (turma?: Turma) => {
    if (turma) {
      setForm({
        nome: turma.nome,
        serie: turma.serie,
        turno: turma.turno,
        ano: turma.ano,
      });
      formModal.open(turma);
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
    if (!form.nome || !form.serie) {
      addToast('Preencha todos os campos obrigatorios', 'error');
      return;
    }

    setSaving(true);
    try {
      if (formModal.data) {
        await turmaService.update(formModal.data.id, { ...form, ativo: true });
        addToast('Turma atualizada com sucesso!', 'success');
      } else {
        await turmaService.create({ ...form, ativo: true });
        addToast('Turma criada com sucesso!', 'success');
      }
      handleCloseModal();
      loadTurmas();
    } catch (error) {
      console.error('Error saving turma:', error);
      addToast('Erro ao salvar turma', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.data) return;

    try {
      await turmaService.update(deleteModal.data.id, { ativo: false });
      addToast('Turma desativada com sucesso!', 'success');
      deleteModal.close();
      loadTurmas();
    } catch (error) {
      console.error('Error deleting turma:', error);
      addToast('Erro ao desativar turma', 'error');
    }
  };

  // Gerar nome baseado em serie e turno
  const generateNome = (serie: string, turno: Turno) => {
    const turnoLetter = turno.charAt(0);
    return `${serie} [ ${turno} ${turnoLetter} ]`;
  };

  useEffect(() => {
    if (form.serie && form.turno) {
      setForm(prev => ({ ...prev, nome: generateNome(prev.serie, prev.turno) }));
    }
  }, [form.serie, form.turno]);

  // Colunas para o DataTable
  const columns = useMemo(() => [
    { id: 'nome' as const, label: 'Nome' },
    { id: 'serie' as const, label: 'Serie' },
    { id: 'turno' as const, label: 'Turno' },
    { id: 'ano' as const, label: 'Ano' },
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
  ], []);

  // Acoes do DataTable
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
  ], []);

  if (!canAccess) {
    return (
      <MainLayout title="Turmas" showSidebar>
        <Alert severity="error">
          Voce nao tem permissao para acessar esta pagina.
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Cadastro de Turmas" showSidebar>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            Turmas
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
            sx={{ textTransform: 'none' }}
          >
            Nova Turma
          </Button>
        </Box>

        {/* Table ou Empty State */}
        {!loading && turmas.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <School sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhuma turma cadastrada
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => handleOpenModal()}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Cadastrar primeira turma
            </Button>
          </Paper>
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

      {/* Add/Edit Modal */}
      <FormModal
        open={formModal.isOpen}
        onClose={handleCloseModal}
        title={formModal.data ? 'Editar Turma' : 'Nova Turma'}
        onSubmit={handleSave}
        submitLabel={saving ? 'Salvando...' : 'Salvar'}
        loading={saving}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Serie</InputLabel>
            <Select
              value={form.serie}
              label="Serie"
              onChange={(e) => setForm(prev => ({ ...prev, serie: e.target.value }))}
            >
              {series.map((serie) => (
                <MenuItem key={serie} value={serie}>{serie}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Turno</InputLabel>
            <Select
              value={form.turno}
              label="Turno"
              onChange={(e) => setForm(prev => ({ ...prev, turno: e.target.value as Turno }))}
            >
              {turnos.map((turno) => (
                <MenuItem key={turno} value={turno}>{turno}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Ano"
            type="number"
            value={form.ano}
            onChange={(e) => setForm(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
            fullWidth
          />

          <TextField
            label="Nome da Turma"
            value={form.nome}
            onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
            fullWidth
            helperText="Gerado automaticamente, mas pode ser editado"
          />
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
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
