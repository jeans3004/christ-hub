/**
 * Aba de gerenciamento de rubricas.
 * Organiza rubricas em grupos: Geral/Colegiado e por Professor.
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Add, Edit, Delete, ExpandMore, DragIndicator, School, Person } from '@mui/icons-material';
import { Rubrica, NivelRubrica, TipoRubrica } from '@/types';
import { rubricaService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { NIVEL_COLORS, DEFAULT_RUBRICAS, NIVEIS } from '../types';
import { RubricaModal } from './RubricaModal';

// Chip para exibir nivel
function NivelChip({ nivel, showLabel }: { nivel: NivelRubrica; showLabel?: boolean }) {
  const colors = NIVEL_COLORS[nivel];
  return (
    <Chip
      label={showLabel ? `${nivel}` : nivel}
      size="small"
      sx={{
        bgcolor: colors.bg,
        color: colors.text,
        border: '1px solid',
        borderColor: colors.border,
        fontWeight: 700,
      }}
    />
  );
}

interface RubricasTabProps {
  rubricas: Rubrica[];
  loading: boolean;
  onRefresh: () => void;
}

// Tipo para grupo de rubricas
interface GrupoRubricas {
  nome: string;
  tipo: 'geral' | 'professor';
  criadorId?: string;
  rubricas: Rubrica[];
}

export function RubricasTab({ rubricas, loading, onRefresh }: RubricasTabProps) {
  const { addToast } = useUIStore();
  const { usuario } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRubrica, setEditingRubrica] = useState<Rubrica | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | false>('geral');

  // Agrupar rubricas por tipo e criador
  const grupos = useMemo((): GrupoRubricas[] => {
    const grupoGeral: GrupoRubricas = {
      nome: 'Geral/Colegiado',
      tipo: 'geral',
      rubricas: rubricas.filter(r => r.tipo === 'geral' || !r.tipo),
    };

    // Agrupar rubricas de professores
    const rubricasProfessores = rubricas.filter(r => r.tipo === 'professor');
    const gruposPorProfessor = new Map<string, GrupoRubricas>();

    rubricasProfessores.forEach(r => {
      const key = r.criadorId || 'desconhecido';
      if (!gruposPorProfessor.has(key)) {
        gruposPorProfessor.set(key, {
          nome: r.criadorNome || 'Professor',
          tipo: 'professor',
          criadorId: r.criadorId,
          rubricas: [],
        });
      }
      gruposPorProfessor.get(key)!.rubricas.push(r);
    });

    // Ordenar grupos: Geral primeiro, depois professores por nome
    const gruposProfessores = Array.from(gruposPorProfessor.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome)
    );

    return [grupoGeral, ...gruposProfessores];
  }, [rubricas]);

  const handleOpenModal = (rubrica?: Rubrica, tipo?: TipoRubrica) => {
    if (rubrica) {
      setEditingRubrica(rubrica);
    } else {
      // Nova rubrica - definir tipo baseado no contexto
      setEditingRubrica(null);
    }
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
    if (!confirm('Deseja criar as rubricas padrão do Colegiado? Isso criará 4 rubricas básicas.')) return;

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

  // Verificar se usuário pode editar rubrica
  const canEdit = (rubrica: Rubrica): boolean => {
    if (rubrica.tipo === 'geral') return true; // Geral pode ser editada por qualquer um
    return rubrica.criadorId === usuario?.id; // Professor só edita as próprias
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
          {grupos[0].rubricas.length === 0 && (
            <Button
              variant="outlined"
              onClick={handleInitializeDefaults}
              disabled={initializing}
              startIcon={initializing ? <CircularProgress size={16} /> : <School />}
            >
              {initializing ? 'Criando...' : 'Criar Padrões Colegiado'}
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

      {/* Grupos de Rubricas */}
      {rubricas.length === 0 ? (
        <Alert severity="info">
          Nenhuma rubrica cadastrada. Clique em "Criar Padrões Colegiado" para iniciar com rubricas básicas ou crie uma nova rubrica.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {grupos.map((grupo) => (
            <Paper key={grupo.tipo === 'geral' ? 'geral' : grupo.criadorId} sx={{ overflow: 'hidden' }}>
              {/* Cabeçalho do Grupo */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: grupo.tipo === 'geral' ? 'primary.main' : 'secondary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedGroup(expandedGroup === (grupo.tipo === 'geral' ? 'geral' : grupo.criadorId) ? false : (grupo.tipo === 'geral' ? 'geral' : grupo.criadorId!))}
              >
                {grupo.tipo === 'geral' ? <School /> : <Person />}
                <Typography fontWeight={600} sx={{ flex: 1 }}>
                  {grupo.nome}
                </Typography>
                <Chip
                  label={`${grupo.rubricas.length} rubrica${grupo.rubricas.length !== 1 ? 's' : ''}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <ExpandMore
                  sx={{
                    transform: expandedGroup === (grupo.tipo === 'geral' ? 'geral' : grupo.criadorId) ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              </Box>

              {/* Conteúdo do Grupo */}
              {expandedGroup === (grupo.tipo === 'geral' ? 'geral' : grupo.criadorId) && (
                <Box sx={{ p: 2 }}>
                  {grupo.rubricas.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" py={2}>
                      Nenhuma rubrica neste grupo
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {grupo.rubricas.map((rubrica) => (
                        <Accordion key={rubrica.id} sx={{ bgcolor: 'grey.50' }}>
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
                            {canEdit(rubrica) && (
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
                            )}
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
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
