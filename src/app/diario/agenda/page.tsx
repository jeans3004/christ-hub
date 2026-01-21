'use client';

/**
 * Página de Agenda Escolar.
 * Permite criar, visualizar e gerenciar eventos.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Add, Edit, Delete, Event, CalendarMonth } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { ConfirmDialog } from '@/components/ui';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { eventoService } from '@/services/firestore';
import { Evento, TipoEvento } from '@/types';

const tipoColors: Record<TipoEvento, 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  aula: 'primary',
  prova: 'error',
  reuniao: 'info',
  feriado: 'success',
  entrega: 'warning',
  excursao: 'secondary',
  outro: 'default' as 'primary',
};

const tipoLabels: Record<TipoEvento, string> = {
  aula: 'Aula',
  prova: 'Prova/Avaliação',
  reuniao: 'Reunião',
  feriado: 'Feriado',
  entrega: 'Entrega',
  excursao: 'Excursão',
  outro: 'Outro',
};

interface EventoFormData {
  titulo: string;
  descricao: string;
  data: string;
  tipo: TipoEvento;
  diaInteiro: boolean;
}

const initialFormData: EventoFormData = {
  titulo: '',
  descricao: '',
  data: new Date().toISOString().split('T')[0],
  tipo: 'outro',
  diaInteiro: true,
};

export default function AgendaPage() {
  const { addToast } = useUIStore();
  const { usuario } = useAuthStore();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Evento | null>(null);

  const [formData, setFormData] = useState<EventoFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar eventos
  const loadEventos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eventoService.getAtivos();
      setEventos(data);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      addToast('Erro ao carregar eventos', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleOpenModal = (evento?: Evento) => {
    if (evento) {
      setEditingEvento(evento);
      setFormData({
        titulo: evento.titulo,
        descricao: evento.descricao || '',
        data: new Date(evento.data).toISOString().split('T')[0],
        tipo: evento.tipo,
        diaInteiro: evento.diaInteiro,
      });
    } else {
      setEditingEvento(null);
      setFormData(initialFormData);
    }
    setErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingEvento(null);
    setFormData(initialFormData);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!usuario) {
      addToast('Usuário não autenticado', 'error');
      return;
    }

    try {
      setSaving(true);

      const eventoData = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || undefined,
        data: new Date(formData.data + 'T00:00:00'),
        tipo: formData.tipo,
        diaInteiro: formData.diaInteiro,
        professorId: usuario.id,
        professorNome: usuario.nome,
        ativo: true,
      };

      if (editingEvento) {
        await eventoService.update(editingEvento.id, eventoData);
        addToast('Evento atualizado com sucesso!', 'success');
      } else {
        await eventoService.create(eventoData);
        addToast('Evento criado com sucesso!', 'success');
      }

      handleCloseModal();
      loadEventos();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      addToast('Erro ao salvar evento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await eventoService.softDelete(deleteConfirm.id);
      addToast('Evento removido!', 'success');
      setDeleteConfirm(null);
      loadEventos();
    } catch (error) {
      console.error('Erro ao remover evento:', error);
      addToast('Erro ao remover evento', 'error');
    }
  };

  // Agrupar eventos por data
  const eventosPorData = eventos.reduce((acc, evento) => {
    const dataKey = new Date(evento.data).toISOString().split('T')[0];
    if (!acc[dataKey]) {
      acc[dataKey] = [];
    }
    acc[dataKey].push(evento);
    return acc;
  }, {} as Record<string, Evento[]>);

  const datasOrdenadas = Object.keys(eventosPorData).sort();

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonth color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Agenda Escolar
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
          >
            Novo Evento
          </Button>
        </Box>

        {/* Lista de Eventos */}
        <Paper>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={32} />
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Carregando eventos...
              </Typography>
            </Box>
          ) : eventos.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Event sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">
                Nenhum evento cadastrado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Clique em &quot;Novo Evento&quot; para adicionar
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {datasOrdenadas.map((dataKey, dataIndex) => (
                <Box key={dataKey}>
                  {dataIndex > 0 && <Divider />}
                  <Box sx={{ bgcolor: 'action.hover', px: 2, py: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {formatDate(new Date(dataKey + 'T00:00:00'))}
                    </Typography>
                  </Box>
                  {eventosPorData[dataKey].map((evento, index) => (
                    <Box key={evento.id}>
                      {index > 0 && <Divider variant="inset" />}
                      <ListItem
                        secondaryAction={
                          <Stack direction="row" spacing={0.5}>
                            <IconButton size="small" onClick={() => handleOpenModal(evento)}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => setDeleteConfirm(evento)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Stack>
                        }
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography fontWeight={500}>{evento.titulo}</Typography>
                              <Chip
                                label={tipoLabels[evento.tipo]}
                                color={tipoColors[evento.tipo]}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              {evento.descricao && (
                                <Typography variant="body2" component="span" display="block">
                                  {evento.descricao}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" component="span">
                                Criado por: {evento.professorNome}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    </Box>
                  ))}
                </Box>
              ))}
            </List>
          )}
        </Paper>
      </Box>

      {/* Modal de Formulário */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEvento ? 'Editar Evento' : 'Novo Evento'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Título do Evento"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              error={Boolean(errors.titulo)}
              helperText={errors.titulo}
              fullWidth
              required
              autoFocus
            />

            <TextField
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              error={Boolean(errors.data)}
              helperText={errors.data}
              fullWidth
              required
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Evento</InputLabel>
              <Select
                value={formData.tipo}
                label="Tipo de Evento"
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoEvento })}
              >
                {Object.entries(tipoLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={label}
                        color={tipoColors[value as TipoEvento]}
                        size="small"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.diaInteiro}
                  onChange={(e) => setFormData({ ...formData, diaInteiro: e.target.checked })}
                />
              }
              label="Dia inteiro"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : editingEvento ? 'Salvar' : 'Criar Evento'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Excluir Evento"
        message={`Tem certeza que deseja excluir o evento "${deleteConfirm?.titulo}"?`}
        confirmLabel="Excluir"
        confirmColor="error"
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirm(null)}
      />
    </MainLayout>
  );
}
