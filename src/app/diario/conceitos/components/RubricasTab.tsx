/**
 * Aba de gerenciamento de rubricas.
 */

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, ExpandMore, DragIndicator } from '@mui/icons-material';
import { Rubrica, NivelRubrica } from '@/types';
import { rubricaService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';
import { NivelChip } from './NivelChip';
import { RubricaModal } from './RubricaModal';
import { DEFAULT_RUBRICAS, NIVEL_COLORS } from '../types';

interface RubricasTabProps {
  rubricas: Rubrica[];
  loading: boolean;
  onRefresh: () => void;
}

export function RubricasTab({ rubricas, loading, onRefresh }: RubricasTabProps) {
  const { addToast } = useUIStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRubrica, setEditingRubrica] = useState<Rubrica | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  const handleOpenModal = (rubrica?: Rubrica) => {
    setEditingRubrica(rubrica || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRubrica(null);
  };

  const handleDelete = async (rubrica: Rubrica) => {
    if (!confirm(`Deseja realmente excluir a rubrica "${rubrica.nome}"?`)) return;

    setDeleting(rubrica.id);
    try {
      await rubricaService.delete(rubrica.id);
      addToast('Rubrica excluída com sucesso!', 'success');
      onRefresh();
    } catch (error) {
      console.error('Error deleting rubrica:', error);
      addToast('Erro ao excluir rubrica', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('Deseja criar as rubricas padrão? Isso criará 4 rubricas básicas.')) return;

    setInitializing(true);
    try {
      for (let i = 0; i < DEFAULT_RUBRICAS.length; i++) {
        const rubrica = DEFAULT_RUBRICAS[i];
        await rubricaService.create({
          nome: rubrica.nome,
          descricao: rubrica.descricao,
          niveis: rubrica.niveis,
          ativo: true,
          ordem: i + 1,
          tipo: 'geral',
        });
      }
      addToast('Rubricas padrão criadas com sucesso!', 'success');
      onRefresh();
    } catch (error) {
      console.error('Error initializing rubricas:', error);
      addToast('Erro ao criar rubricas padrão', 'error');
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Rubricas de Avaliação
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {rubricas.length === 0 && (
            <Button
              variant="outlined"
              onClick={handleInitializeDefaults}
              disabled={initializing}
              startIcon={initializing ? <CircularProgress size={16} /> : null}
            >
              {initializing ? 'Criando...' : 'Criar Padrões'}
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
          >
            Nova Rubrica
          </Button>
        </Box>
      </Box>

      {/* Lista de Rubricas */}
      {rubricas.length === 0 ? (
        <Alert severity="info">
          Nenhuma rubrica cadastrada. Clique em "Criar Padrões" para iniciar com rubricas básicas ou crie uma nova rubrica.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {rubricas.map((rubrica) => (
            <Accordion key={rubrica.id} sx={{ bgcolor: 'background.paper' }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, mr: 2 }}>
                  <DragIndicator sx={{ color: 'grey.400', cursor: 'grab' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={600}>{rubrica.nome}</Typography>
                    {rubrica.descricao && (
                      <Typography variant="body2" color="text.secondary">
                        {rubrica.descricao}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={rubrica.ativo ? 'Ativa' : 'Inativa'}
                    size="small"
                    color={rubrica.ativo ? 'success' : 'default'}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {/* Níveis */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Níveis de avaliação:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  {rubrica.niveis.map((nivel) => (
                    <Box
                      key={nivel.nivel}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        p: 1.5,
                        bgcolor: NIVEL_COLORS[nivel.nivel as NivelRubrica].bg,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: NIVEL_COLORS[nivel.nivel as NivelRubrica].border,
                      }}
                    >
                      <NivelChip nivel={nivel.nivel as NivelRubrica} showLabel />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {nivel.descricao}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Ações */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleOpenModal(rubrica)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={deleting === rubrica.id ? <CircularProgress size={16} /> : <Delete />}
                    onClick={() => handleDelete(rubrica)}
                    disabled={deleting === rubrica.id}
                  >
                    Excluir
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Modal */}
      <RubricaModal
        open={modalOpen}
        rubrica={editingRubrica}
        existingOrder={rubricas.length}
        onClose={handleCloseModal}
        onSave={onRefresh}
      />
    </Box>
  );
}
