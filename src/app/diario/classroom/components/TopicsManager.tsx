/**
 * Gerenciador de temas (topics) do Google Classroom.
 * Permite visualizar, criar, editar e excluir temas.
 * Suporta multiplas turmas com selecao para criacao.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  OutlinedInput,
  ListItemButton,
} from '@mui/material';
import {
  Topic as TopicIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Folder as FolderIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useDriveStore } from '@/store/driveStore';
import { useUIStore } from '@/store/uiStore';
import { createClassroomService } from '@/services/classroomService';
import type { ClassroomCourse, ClassroomTopic } from '@/types/classroom';

interface TopicsManagerProps {
  open: boolean;
  onClose: () => void;
  courses: ClassroomCourse[];
  topics: ClassroomTopic[];
  onTopicCreated: () => void;
  getCourseNameById?: (courseId: string) => string;
}

export function TopicsManager({
  open,
  onClose,
  courses,
  topics,
  onTopicCreated,
  getCourseNameById,
}: TopicsManagerProps) {
  const { accessToken } = useDriveStore();
  const { addToast } = useUIStore();

  const isMultiCourse = courses.length > 1;

  // Estados para criar novo tema
  const [newTopicName, setNewTopicName] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // Sincronizar selectedCourseIds quando o modal abre ou cursos mudam
  useEffect(() => {
    if (open) {
      if (courses.length === 1) {
        setSelectedCourseIds([courses[0].id]);
      } else {
        setSelectedCourseIds([]);
      }
    }
  }, [open, courses]);
  const [isCreating, setIsCreating] = useState(false);

  // Estados para editar tema
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados para excluir tema
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  // Filtro por turma
  const [filterCourse, setFilterCourse] = useState<string>('all');

  const [error, setError] = useState<string | null>(null);

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) {
      addToast('Digite um nome para o tema', 'warning');
      return;
    }

    if (selectedCourseIds.length === 0) {
      addToast('Selecione pelo menos uma turma', 'warning');
      return;
    }

    if (!accessToken) {
      setError('Token de acesso nao disponivel');
      return;
    }

    setIsCreating(true);
    setError(null);

    const service = createClassroomService(accessToken);
    const results: { courseId: string; success: boolean; error?: string }[] = [];

    for (const courseId of selectedCourseIds) {
      try {
        await service.createTopic(courseId, newTopicName.trim());
        results.push({ courseId, success: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        results.push({ courseId, success: false, error: message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    if (failCount === 0) {
      addToast(
        `Tema "${newTopicName}" criado em ${successCount} turma(s)!`,
        'success'
      );
      setNewTopicName('');
      if (courses.length > 1) {
        setSelectedCourseIds([]);
      }
      onTopicCreated();
    } else if (successCount > 0) {
      addToast(
        `Tema criado em ${successCount} turma(s), ${failCount} erro(s)`,
        'warning'
      );
      onTopicCreated();
    } else {
      const firstError = results.find((r) => r.error)?.error;
      setError(firstError || 'Erro ao criar tema');
      addToast('Erro ao criar tema em todas as turmas', 'error');
    }

    setIsCreating(false);
  };

  const handleStartEdit = (topic: ClassroomTopic) => {
    setEditingTopicId(topic.topicId);
    setEditingCourseId(topic.courseId);
    setEditingName(topic.name);
  };

  const handleCancelEdit = () => {
    setEditingTopicId(null);
    setEditingCourseId(null);
    setEditingName('');
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim() || !editingTopicId || !editingCourseId) {
      addToast('Digite um nome para o tema', 'warning');
      return;
    }

    if (!accessToken) {
      setError('Token de acesso nao disponivel');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const service = createClassroomService(accessToken);
      await service.updateTopic(editingCourseId, editingTopicId, editingName.trim());

      addToast('Tema atualizado com sucesso!', 'success');
      setEditingTopicId(null);
      setEditingCourseId(null);
      setEditingName('');
      onTopicCreated();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar tema';
      setError(message);
      addToast(message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTopic = async (topic: ClassroomTopic) => {
    if (!accessToken) {
      setError('Token de acesso nao disponivel');
      return;
    }

    const courseName = getCourseNameById ? getCourseNameById(topic.courseId) : topic.courseId;
    if (!confirm(`Tem certeza que deseja excluir o tema "${topic.name}"${isMultiCourse ? ` da turma ${courseName}` : ''}?\n\nAs atividades associadas a este tema ficarao sem tema.`)) {
      return;
    }

    setDeletingTopicId(topic.topicId);
    setError(null);

    try {
      const service = createClassroomService(accessToken);
      await service.deleteTopic(topic.courseId, topic.topicId);

      addToast(`Tema "${topic.name}" excluido com sucesso!`, 'success');
      onTopicCreated();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir tema';
      setError(message);
      addToast(message, 'error');
    } finally {
      setDeletingTopicId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating && newTopicName.trim() && selectedCourseIds.length > 0) {
      handleCreateTopic();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isUpdating && editingName.trim()) {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Filtrar topicos
  const filteredTopics = filterCourse === 'all'
    ? topics
    : topics.filter((t) => t.courseId === filterCourse);

  // Agrupar topicos por turma
  const topicsByCourse = topics.reduce((acc, topic) => {
    if (!acc[topic.courseId]) {
      acc[topic.courseId] = [];
    }
    acc[topic.courseId].push(topic);
    return acc;
  }, {} as Record<string, ClassroomTopic[]>);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TopicIcon color="primary" />
            <Typography variant="h6">Temas</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        {courses.length === 1 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {courses[0].name}
          </Typography>
        )}
        {courses.length > 1 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {courses.length} turmas selecionadas
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Criar novo tema */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AddIcon fontSize="small" />
            Criar novo tema
          </Typography>

          {/* Selecao de turmas (apenas se multiplas turmas) */}
          {isMultiCourse && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Criar em quais turmas?</InputLabel>
              <Select
                multiple
                value={selectedCourseIds}
                onChange={(e) => setSelectedCourseIds(e.target.value as string[])}
                input={<OutlinedInput label="Criar em quais turmas?" />}
                renderValue={(selected) =>
                  selected.length === courses.length
                    ? 'Todas as turmas'
                    : selected.map((id) => getCourseNameById?.(id) || id).join(', ')
                }
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    <Checkbox checked={selectedCourseIds.includes(course.id)} size="small" />
                    <ListItemText primary={course.name} secondary={course.section} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Nome do tema"
              placeholder="Ex: Unidade 1 - Introducao"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isCreating || courses.length === 0}
            />
            <Button
              variant="contained"
              onClick={handleCreateTopic}
              disabled={isCreating || !newTopicName.trim() || selectedCourseIds.length === 0}
              sx={{ minWidth: 100 }}
            >
              {isCreating ? <CircularProgress size={20} color="inherit" /> : 'Criar'}
            </Button>
          </Box>

          {isMultiCourse && selectedCourseIds.length > 0 && (
            <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
              Sera criado em {selectedCourseIds.length} turma(s)
            </Typography>
          )}
        </Paper>

        <Divider sx={{ mb: 2 }} />

        {/* Filtro e lista de temas existentes */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle2">Temas existentes</Typography>

          {isMultiCourse && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filtrar</InputLabel>
              <Select
                value={filterCourse}
                label="Filtrar"
                onChange={(e) => setFilterCourse(e.target.value)}
              >
                <MenuItem value="all">Todas ({topics.length})</MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.name} ({topicsByCourse[course.id]?.length || 0})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {filteredTopics.length === 0 ? (
          <Alert severity="info" icon={<FolderIcon />}>
            {filterCourse === 'all'
              ? 'Nenhum tema criado nas turmas selecionadas.'
              : 'Nenhum tema nesta turma.'}
          </Alert>
        ) : (
          <List dense>
            {filteredTopics.map((topic, index) => {
              const courseName = getCourseNameById?.(topic.courseId) || topic.courseId;
              const isEditing = editingTopicId === topic.topicId && editingCourseId === topic.courseId;
              const isDeleting = deletingTopicId === topic.topicId;

              return (
                <ListItem
                  key={`${topic.courseId}-${topic.topicId}`}
                  divider={index < filteredTopics.length - 1}
                  sx={{ pr: isEditing ? 1 : 12 }}
                >
                  <ListItemIcon>
                    <FolderIcon color="action" />
                  </ListItemIcon>

                  {isEditing ? (
                    // Modo de edicao
                    <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        disabled={isUpdating}
                        autoFocus
                        fullWidth
                      />
                      <Tooltip title="Salvar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={handleSaveEdit}
                          disabled={isUpdating || !editingName.trim()}
                        >
                          {isUpdating ? <CircularProgress size={18} /> : <CheckIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancelar">
                        <IconButton
                          size="small"
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    // Modo de visualizacao
                    <>
                      <ListItemText
                        primary={topic.name}
                        secondary={isMultiCourse ? courseName : undefined}
                        secondaryTypographyProps={
                          isMultiCourse
                            ? {
                                component: 'span',
                                sx: {
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  color: 'primary.main',
                                  fontSize: '0.75rem',
                                },
                              }
                            : undefined
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleStartEdit(topic)}
                            disabled={isDeleting}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteTopic(topic)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <CircularProgress size={18} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </>
                  )}
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
