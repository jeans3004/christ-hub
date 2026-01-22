/**
 * Aba de relatorios dos professores sobre o aluno.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Add, Edit, Delete, Person, CalendarMonth } from '@mui/icons-material';
import { RelatorioAluno, Usuario } from '@/types';
import { relatorioService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';

interface TabPanelRelatoriosProps {
  alunoId: string;
  alunoNome: string;
  turmaId: string;
  usuario: Usuario | null;
  ano: number;
}

interface RelatorioFormData {
  titulo: string;
  conteudo: string;
  bimestre?: 1 | 2 | 3 | 4;
}

const initialFormData: RelatorioFormData = {
  titulo: '',
  conteudo: '',
  bimestre: undefined,
};

export function TabPanelRelatorios({
  alunoId,
  alunoNome,
  turmaId,
  usuario,
  ano,
}: TabPanelRelatoriosProps) {
  const { addToast } = useUIStore();
  const [relatorios, setRelatorios] = useState<RelatorioAluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RelatorioFormData>(initialFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadRelatorios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await relatorioService.getByAluno(alunoId, ano);
      setRelatorios(data);
    } catch (error) {
      console.error('Error loading relatorios:', error);
      addToast('Erro ao carregar relatórios', 'error');
    } finally {
      setLoading(false);
    }
  }, [alunoId, ano, addToast]);

  useEffect(() => {
    loadRelatorios();
  }, [loadRelatorios]);

  const handleOpenModal = (relatorio?: RelatorioAluno) => {
    if (relatorio) {
      setEditingId(relatorio.id);
      setFormData({
        titulo: relatorio.titulo,
        conteudo: relatorio.conteudo,
        bimestre: relatorio.bimestre,
      });
    } else {
      setEditingId(null);
      setFormData(initialFormData);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    if (!formData.titulo.trim() || !formData.conteudo.trim()) {
      addToast('Preencha o título e o conteúdo', 'error');
      return;
    }

    if (!usuario) {
      addToast('Usuário não identificado', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await relatorioService.update(editingId, {
          titulo: formData.titulo,
          conteudo: formData.conteudo,
          bimestre: formData.bimestre,
        });
        addToast('Relatório atualizado com sucesso!', 'success');
      } else {
        await relatorioService.create({
          alunoId,
          alunoNome,
          turmaId,
          professorId: usuario.id,
          professorNome: usuario.nome,
          titulo: formData.titulo,
          conteudo: formData.conteudo,
          bimestre: formData.bimestre,
          ano,
        });
        addToast('Relatório criado com sucesso!', 'success');
      }
      handleCloseModal();
      loadRelatorios();
    } catch (error) {
      console.error('Error saving relatorio:', error);
      addToast('Erro ao salvar relatório', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await relatorioService.delete(deleteConfirmId);
      addToast('Relatório excluído com sucesso!', 'success');
      setDeleteConfirmId(null);
      loadRelatorios();
    } catch (error) {
      console.error('Error deleting relatorio:', error);
      addToast('Erro ao excluir relatório', 'error');
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canEdit = (relatorio: RelatorioAluno) => {
    if (!usuario) return false;
    // Professor pode editar próprios relatórios, coordenador/admin pode editar todos
    return relatorio.professorId === usuario.id || usuario.tipo === 'coordenador' || usuario.tipo === 'administrador';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Relatórios dos Professores
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenModal()}
          disabled={!usuario}
        >
          Novo Relatório
        </Button>
      </Box>

      {relatorios.length === 0 ? (
        <Alert severity="info">
          Nenhum relatório registrado para este aluno no ano de {ano}.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {relatorios.map((relatorio) => (
            <Card key={relatorio.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {relatorio.titulo}
                  </Typography>
                  {relatorio.bimestre && (
                    <Chip
                      label={`${relatorio.bimestre}º Bimestre`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Person fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {relatorio.professorNome}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarMonth fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(relatorio.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {relatorio.conteudo}
                </Typography>
              </CardContent>

              {canEdit(relatorio) && (
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <IconButton size="small" onClick={() => handleOpenModal(relatorio)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteConfirmId(relatorio.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </CardActions>
              )}
            </Card>
          ))}
        </Box>
      )}

      {/* Modal de criação/edição */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Relatório' : 'Novo Relatório'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Título"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              fullWidth
              required
              placeholder="Ex: Observações sobre desempenho em Matemática"
            />

            <TextField
              label="Bimestre (opcional)"
              select
              value={formData.bimestre || ''}
              onChange={(e) => setFormData({ ...formData, bimestre: e.target.value ? Number(e.target.value) as 1 | 2 | 3 | 4 : undefined })}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="">Sem bimestre específico</option>
              <option value="1">1º Bimestre</option>
              <option value="2">2º Bimestre</option>
              <option value="3">3º Bimestre</option>
              <option value="4">4º Bimestre</option>
            </TextField>

            <TextField
              label="Conteúdo"
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              fullWidth
              required
              multiline
              rows={6}
              placeholder="Descreva suas observações sobre o aluno..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !formData.titulo.trim() || !formData.conteudo.trim()}
          >
            {saving ? <CircularProgress size={24} /> : editingId ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja excluir este relatório?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
