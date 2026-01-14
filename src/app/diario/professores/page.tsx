'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import DataTable from '@/components/ui/DataTable';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useUIStore } from '@/store/uiStore';
import { Professor } from '@/types';

const mockProfessores: Professor[] = [
  {
    id: '1',
    nome: 'Carlos Alberto Cruz Pinto',
    cpf: '123.456.789-00',
    telefone: '(62) 99377-6304',
    coordenador: true,
    disciplinas: ['Matemática', 'Física'],
    turmas: [],
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    nome: 'Maria Silva Santos',
    cpf: '987.654.321-00',
    telefone: '(62) 98888-7777',
    coordenador: false,
    disciplinas: ['Português', 'Literatura'],
    turmas: [],
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockDisciplinas = [
  'Matemática',
  'Português',
  'História',
  'Geografia',
  'Ciências',
  'Física',
  'Química',
  'Biologia',
  'Inglês',
  'Educação Física',
  'Artes',
  'Filosofia',
  'Sociologia',
];

export default function ProfessoresPage() {
  const { addToast } = useUIStore();
  const [professores, setProfessores] = useState<Professor[]>(mockProfessores);
  const [filtro, setFiltro] = useState({ nome: '', cpf: '', telefone: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [turmaModalOpen, setTurmaModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: '' });
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    coordenador: false,
    disciplinas: [] as string[],
  });

  const filteredProfessores = professores.filter((p) => {
    const matchNome = !filtro.nome || p.nome.toLowerCase().includes(filtro.nome.toLowerCase());
    const matchCpf = !filtro.cpf || p.cpf.includes(filtro.cpf);
    const matchTelefone = !filtro.telefone || (p.telefone && p.telefone.includes(filtro.telefone));
    return matchNome && matchCpf && matchTelefone;
  });

  const handleOpenModal = (professor?: Professor) => {
    if (professor) {
      setEditingProfessor(professor);
      setFormData({
        nome: professor.nome,
        cpf: professor.cpf,
        telefone: professor.telefone || '',
        coordenador: professor.coordenador,
        disciplinas: professor.disciplinas,
      });
    } else {
      setEditingProfessor(null);
      setFormData({
        nome: '',
        cpf: '',
        telefone: '',
        coordenador: false,
        disciplinas: [],
      });
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editingProfessor) {
      setProfessores(prev =>
        prev.map(p =>
          p.id === editingProfessor.id
            ? { ...p, ...formData, updatedAt: new Date() }
            : p
        )
      );
      addToast('Professor atualizado com sucesso!', 'success');
    } else {
      const newProfessor: Professor = {
        id: Date.now().toString(),
        ...formData,
        turmas: [],
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProfessores(prev => [...prev, newProfessor]);
      addToast('Professor cadastrado com sucesso!', 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setProfessores(prev => prev.filter(p => p.id !== id));
    addToast('Professor excluído com sucesso!', 'success');
    setDeleteDialog({ open: false, id: '' });
  };

  const handleDisciplinaToggle = (disciplina: string) => {
    setFormData(prev => ({
      ...prev,
      disciplinas: prev.disciplinas.includes(disciplina)
        ? prev.disciplinas.filter(d => d !== disciplina)
        : [...prev.disciplinas, disciplina],
    }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

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
        {/* Filters */}
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="Nome"
              size="small"
              value={filtro.nome}
              onChange={(e) => setFiltro(prev => ({ ...prev, nome: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="CPF"
              size="small"
              value={filtro.cpf}
              onChange={(e) => setFiltro(prev => ({ ...prev, cpf: e.target.value }))}
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="Telefone"
              size="small"
              placeholder="(99) 9999-9999"
              value={filtro.telefone}
              onChange={(e) => setFiltro(prev => ({ ...prev, telefone: e.target.value }))}
              sx={{ minWidth: 150 }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenModal()}
            >
              Novo Professor
            </Button>
          </Box>
        </Paper>

        {/* Disciplinas do Professor Selecionado */}
        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Disciplina (s)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editingProfessor?.disciplinas.map((d) => (
                  <TableRow key={d}>
                    <TableCell>{d}</TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell>Selecione um professor para ver as disciplinas</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Professores Table */}
        <DataTable
          columns={columns}
          data={filteredProfessores}
          actions={actions}
          rowKey="id"
          emptyMessage="Nenhum professor encontrado"
        />
      </Box>

      {/* Professor Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProfessor ? 'Editar Professor(a)' : 'Cadastro do(a) Professor(a)'}
        onSubmit={handleSave}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nome"
            value={formData.nome}
            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            required
            fullWidth
          />
          <TextField
            label="CPF"
            value={formData.cpf}
            onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
            inputProps={{ maxLength: 14 }}
            required
            fullWidth
          />
          <TextField
            label="Telefone"
            value={formData.telefone}
            onChange={(e) => setFormData(prev => ({ ...prev, telefone: formatTelefone(e.target.value) }))}
            placeholder="(99) 99999-9999"
            inputProps={{ maxLength: 15 }}
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.coordenador}
                onChange={(e) => setFormData(prev => ({ ...prev, coordenador: e.target.checked }))}
              />
            }
            label="Coordenador"
          />

          <Box>
            <Box sx={{ fontWeight: 500, mb: 1 }}>Disciplinas:</Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {mockDisciplinas.map((d) => (
                <FormControlLabel
                  key={d}
                  control={
                    <Checkbox
                      checked={formData.disciplinas.includes(d)}
                      onChange={() => handleDisciplinaToggle(d)}
                      size="small"
                    />
                  }
                  label={d}
                  sx={{ width: 'calc(50% - 8px)' }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
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
