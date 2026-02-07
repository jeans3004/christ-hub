/**
 * Tabela de atividades do Google Classroom.
 * Suporta visualizacao de multiplas turmas com marcadores.
 * Suporta selecao multipla para exclusao em lote e edicao.
 */

'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Skeleton,
  Alert,
  LinearProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  OpenInNew as OpenInNewIcon,
  Assignment as AssignmentIcon,
  Quiz as QuizIcon,
  ShortText as ShortTextIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  School as SchoolIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import type {
  ClassroomCourseWork,
  ClassroomStudent,
  ClassroomStudentSubmission,
  ClassroomTopic,
} from '@/types/classroom';

interface CourseworkTableProps {
  courseWork: ClassroomCourseWork[];
  students: ClassroomStudent[];
  submissions: Map<string, ClassroomStudentSubmission[]>;
  topics: ClassroomTopic[];
  isLoading: boolean;
  onLoadSubmissions: (courseWorkId: string) => void;
  getSubmissionStats: (
    courseWorkId: string,
    submissions: Map<string, ClassroomStudentSubmission[]>,
    totalStudents: number
  ) => {
    total: number;
    turnedIn: number;
    pending: number;
    late: number;
    graded: number;
    percentComplete: number;
  };
  getCourseNameById?: (courseId: string) => string;
  isMultiCourse?: boolean;
  onDeleteCourseWork?: (courseId: string, courseWorkId: string) => Promise<void>;
  onDeleteMultipleCourseWork?: (items: { courseId: string; courseWorkId: string }[]) => Promise<void>;
  onEditCourseWork?: (
    courseId: string,
    courseWorkId: string,
    data: {
      title?: string;
      description?: string;
      maxPoints?: number;
      topicId?: string;
      dueDate?: { year: number; month: number; day: number } | null;
    }
  ) => Promise<void>;
  canDelete?: boolean;
  canEdit?: boolean;
}

interface EditFormData {
  title: string;
  description: string;
  maxPoints: string;
  topicId: string;
  dueDateStr: string;
}

function CourseworkRow({
  cw,
  students,
  submissions,
  topics,
  onLoadSubmissions,
  getSubmissionStats,
  getCourseNameById,
  isMultiCourse,
  onDeleteCourseWork,
  onEditCourseWork,
  canDelete,
  canEdit,
  isSelected,
  onToggleSelect,
  isDeleting,
}: {
  cw: ClassroomCourseWork;
  students: ClassroomStudent[];
  submissions: Map<string, ClassroomStudentSubmission[]>;
  topics: ClassroomTopic[];
  onLoadSubmissions: (courseWorkId: string) => void;
  getSubmissionStats: CourseworkTableProps['getSubmissionStats'];
  getCourseNameById?: (courseId: string) => string;
  isMultiCourse?: boolean;
  onDeleteCourseWork?: (courseId: string, courseWorkId: string) => Promise<void>;
  onEditCourseWork?: CourseworkTableProps['onEditCourseWork'];
  canDelete?: boolean;
  canEdit?: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  isDeleting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isItemDeleting, setIsItemDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    title: '',
    description: '',
    maxPoints: '',
    topicId: '',
    dueDateStr: '',
  });

  // Filtrar alunos da mesma turma
  const courseStudents = students.filter((s) => s.courseId === cw.courseId);
  const stats = getSubmissionStats(cw.id, submissions, courseStudents.length);
  const cwSubmissions = submissions.get(cw.id) || [];
  const topic = topics.find((t) => t.topicId === cw.topicId);
  const courseName = getCourseNameById ? getCourseNameById(cw.courseId) : '';
  const courseTopics = topics.filter((t) => t.courseId === cw.courseId);

  const handleExpand = () => {
    if (!open && cwSubmissions.length === 0) {
      onLoadSubmissions(cw.id);
    }
    setOpen(!open);
  };

  // Verifica se esta vencido
  const isOverdue = () => {
    if (!cw.dueDate) return false;
    const due = new Date(cw.dueDate.year, cw.dueDate.month - 1, cw.dueDate.day);
    return due < new Date();
  };

  // Icone por tipo
  const getTypeIcon = () => {
    switch (cw.workType) {
      case 'ASSIGNMENT':
        return <AssignmentIcon fontSize="small" />;
      case 'SHORT_ANSWER_QUESTION':
        return <ShortTextIcon fontSize="small" />;
      case 'MULTIPLE_CHOICE_QUESTION':
        return <QuizIcon fontSize="small" />;
      default:
        return <AssignmentIcon fontSize="small" />;
    }
  };

  // Formata data de prazo
  const formatDueDate = () => {
    if (!cw.dueDate) return 'Sem prazo';
    const { day, month, year } = cw.dueDate;
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  };

  const handleDeleteSingle = async () => {
    if (!onDeleteCourseWork) return;

    const confirmMessage = isMultiCourse && courseName
      ? `Tem certeza que deseja excluir a atividade "${cw.title}" da turma "${courseName}"?\n\nEsta acao nao pode ser desfeita.`
      : `Tem certeza que deseja excluir a atividade "${cw.title}"?\n\nEsta acao nao pode ser desfeita.`;

    if (!confirm(confirmMessage)) return;

    setIsItemDeleting(true);
    try {
      await onDeleteCourseWork(cw.courseId, cw.id);
    } finally {
      setIsItemDeleting(false);
    }
  };

  const handleOpenEdit = () => {
    const dueDateStr = cw.dueDate
      ? `${cw.dueDate.year}-${cw.dueDate.month.toString().padStart(2, '0')}-${cw.dueDate.day.toString().padStart(2, '0')}`
      : '';

    setEditForm({
      title: cw.title,
      description: cw.description || '',
      maxPoints: cw.maxPoints?.toString() || '',
      topicId: cw.topicId || '',
      dueDateStr,
    });
    setEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!onEditCourseWork || !editForm.title.trim()) return;

    setIsSaving(true);
    try {
      let dueDate: { year: number; month: number; day: number } | null = null;
      if (editForm.dueDateStr) {
        const [year, month, day] = editForm.dueDateStr.split('-').map(Number);
        dueDate = { year, month, day };
      }

      await onEditCourseWork(cw.courseId, cw.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        maxPoints: editForm.maxPoints ? parseInt(editForm.maxPoints) : undefined,
        topicId: editForm.topicId || undefined,
        dueDate,
      });
      handleCloseEdit();
    } finally {
      setIsSaving(false);
    }
  };

  const currentlyDeleting = isDeleting || isItemDeleting;

  return (
    <>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          opacity: currentlyDeleting ? 0.5 : 1,
          bgcolor: isSelected ? 'action.selected' : 'inherit',
        }}
      >
        {canDelete && (
          <TableCell padding="checkbox">
            <Checkbox
              checked={isSelected}
              onChange={onToggleSelect}
              size="small"
              disabled={currentlyDeleting}
            />
          </TableCell>
        )}
        <TableCell padding="checkbox">
          <IconButton size="small" onClick={handleExpand}>
            {open ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </TableCell>
        {isMultiCourse && (
          <TableCell>
            <Chip
              icon={<SchoolIcon />}
              label={courseName}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ maxWidth: 150 }}
            />
          </TableCell>
        )}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getTypeIcon()}
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {cw.title}
              </Typography>
              {topic && (
                <Typography variant="caption" color="text.secondary">
                  {topic.name}
                </Typography>
              )}
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={
              cw.workType === 'ASSIGNMENT'
                ? 'Tarefa'
                : cw.workType === 'SHORT_ANSWER_QUESTION'
                  ? 'Resposta'
                  : 'Multipla'
            }
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isOverdue() && (
              <Tooltip title="Prazo vencido">
                <WarningIcon color="error" fontSize="small" />
              </Tooltip>
            )}
            <Typography
              variant="body2"
              color={isOverdue() ? 'error.main' : 'text.primary'}
            >
              {formatDueDate()}
            </Typography>
          </Box>
        </TableCell>
        <TableCell align="center">{cw.maxPoints || '-'}</TableCell>
        <TableCell>
          <Box sx={{ minWidth: 120 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption">
                {stats.turnedIn}/{stats.total}
              </Typography>
              <Typography variant="caption">{stats.percentComplete}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats.percentComplete}
              color={stats.percentComplete === 100 ? 'success' : 'primary'}
            />
            {stats.late > 0 && (
              <Typography variant="caption" color="error">
                {stats.late} atrasado(s)
              </Typography>
            )}
          </Box>
        </TableCell>
        <TableCell align="center">
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
            {canEdit && onEditCourseWork && (
              <Tooltip title="Editar atividade">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={handleOpenEdit}
                  disabled={currentlyDeleting}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Abrir no Classroom">
              <IconButton
                size="small"
                onClick={() => window.open(cw.alternateLink, '_blank')}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canDelete && onDeleteCourseWork && (
              <Tooltip title="Excluir atividade">
                <IconButton
                  size="small"
                  color="error"
                  onClick={handleDeleteSingle}
                  disabled={currentlyDeleting}
                >
                  {isItemDeleting ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </TableCell>
      </TableRow>

      {/* Linha de entregas expandida */}
      <TableRow>
        <TableCell colSpan={canDelete ? (isMultiCourse ? 10 : 9) : (isMultiCourse ? 9 : 8)} sx={{ py: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Entregas dos Alunos
              </Typography>
              {cwSubmissions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Carregando entregas...
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Aluno</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Resposta</TableCell>
                      <TableCell>Nota</TableCell>
                      <TableCell>Atrasado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cwSubmissions.map((sub) => {
                      const student = courseStudents.find((s) => s.userId === sub.userId);

                      // Resolve answer content
                      let answerContent: React.ReactNode = null;
                      if (sub.shortAnswerSubmission?.answer) {
                        answerContent = (
                          <Typography variant="body2" sx={{ maxWidth: 400, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {sub.shortAnswerSubmission.answer}
                          </Typography>
                        );
                      } else if (sub.multipleChoiceSubmission?.answer) {
                        answerContent = (
                          <Chip label={sub.multipleChoiceSubmission.answer} size="small" variant="outlined" />
                        );
                      } else if (sub.assignmentSubmission?.attachments && sub.assignmentSubmission.attachments.length > 0) {
                        answerContent = (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {sub.assignmentSubmission.attachments.map((att, i) => {
                              const title = att.driveFile?.driveFile?.title
                                || att.link?.title
                                || att.youtubeVideo?.title
                                || 'Anexo';
                              const url = att.driveFile?.driveFile?.alternateLink
                                || att.link?.url
                                || att.youtubeVideo?.alternateLink;

                              return (
                                <Chip
                                  key={i}
                                  label={title}
                                  size="small"
                                  variant="outlined"
                                  clickable={!!url}
                                  onClick={url ? () => window.open(url, '_blank') : undefined}
                                  icon={<OpenInNewIcon sx={{ fontSize: '0.85rem !important' }} />}
                                />
                              );
                            })}
                          </Box>
                        );
                      }

                      return (
                        <TableRow key={sub.id}>
                          <TableCell>
                            {student?.profile.name.fullName || 'Aluno desconhecido'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                sub.state === 'TURNED_IN'
                                  ? 'Entregue'
                                  : sub.state === 'RETURNED'
                                    ? 'Devolvido'
                                    : sub.state === 'RECLAIMED_BY_STUDENT'
                                      ? 'Retomado'
                                      : 'Pendente'
                              }
                              size="small"
                              color={
                                sub.state === 'TURNED_IN' || sub.state === 'RETURNED'
                                  ? 'success'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {answerContent || (
                              <Typography variant="caption" color="text.disabled">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {sub.assignedGrade !== undefined
                              ? `${sub.assignedGrade}/${cw.maxPoints || 100}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {sub.late && <Chip label="Atrasado" size="small" color="error" />}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      {/* Modal de edicao */}
      <Dialog open={editModalOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon color="primary" />
              <Typography variant="h6">Editar Atividade</Typography>
            </Box>
            <IconButton onClick={handleCloseEdit} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          {isMultiCourse && courseName && (
            <Typography variant="body2" color="text.secondary">
              {courseName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Titulo"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              disabled={isSaving}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descricao"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              disabled={isSaving}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Pontuacao Maxima"
                type="number"
                value={editForm.maxPoints}
                onChange={(e) => setEditForm({ ...editForm, maxPoints: e.target.value })}
                disabled={isSaving}
                sx={{ flex: 1 }}
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Data de Entrega"
                type="date"
                value={editForm.dueDateStr}
                onChange={(e) => setEditForm({ ...editForm, dueDateStr: e.target.value })}
                disabled={isSaving}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            {courseTopics.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Tema</InputLabel>
                <Select
                  value={editForm.topicId}
                  label="Tema"
                  onChange={(e) => setEditForm({ ...editForm, topicId: e.target.value })}
                  disabled={isSaving}
                >
                  <MenuItem value="">Sem tema</MenuItem>
                  {courseTopics.map((t) => (
                    <MenuItem key={t.topicId} value={t.topicId}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={isSaving || !editForm.title.trim()}
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function CourseworkTable({
  courseWork,
  students,
  submissions,
  topics,
  isLoading,
  onLoadSubmissions,
  getSubmissionStats,
  getCourseNameById,
  isMultiCourse = false,
  onDeleteCourseWork,
  onDeleteMultipleCourseWork,
  onEditCourseWork,
  canDelete = false,
  canEdit = false,
}: CourseworkTableProps) {
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  if (isLoading) {
    return (
      <Box>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  if (courseWork.length === 0) {
    return <Alert severity="info">Nenhuma atividade publicada nas turmas selecionadas.</Alert>;
  }

  // Obter lista unica de turmas
  const uniqueCourseIds = [...new Set(courseWork.map((cw) => cw.courseId))];

  // Filtrar por turma e topico
  let filteredWork = courseWork;

  if (filterCourse !== 'all') {
    filteredWork = filteredWork.filter((cw) => cw.courseId === filterCourse);
  }

  if (filterTopic !== 'all') {
    filteredWork = filteredWork.filter((cw) => cw.topicId === filterTopic);
  }

  // Topicos disponiveis para o filtro (baseado na turma selecionada)
  const availableTopics = filterCourse === 'all'
    ? topics
    : topics.filter((t) => t.courseId === filterCourse);

  // Selection helpers
  const getSelectionKey = (cw: ClassroomCourseWork) => `${cw.courseId}::${cw.id}`;

  const isSelected = (cw: ClassroomCourseWork) => selectedIds.has(getSelectionKey(cw));

  const toggleSelection = (cw: ClassroomCourseWork) => {
    const key = getSelectionKey(cw);
    const newSelected = new Set(selectedIds);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const allKeys = filteredWork.map(getSelectionKey);
    setSelectedIds(new Set(allKeys));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (!onDeleteMultipleCourseWork || selectedIds.size === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir ${selectedIds.size} atividade(s) selecionada(s)?\n\nEsta acao nao pode ser desfeita.`;
    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      const items = Array.from(selectedIds).map((key) => {
        const [courseId, courseWorkId] = key.split('::');
        return { courseId, courseWorkId };
      });
      await onDeleteMultipleCourseWork(items);
      clearSelection();
    } finally {
      setIsDeleting(false);
    }
  };

  const hasSelection = selectedIds.size > 0;
  const allSelected = filteredWork.length > 0 && selectedIds.size === filteredWork.length;

  return (
    <Box>
      {/* Toolbar de selecao */}
      {canDelete && (
        <Paper sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Checkbox
              checked={allSelected}
              indeterminate={hasSelection && !allSelected}
              onChange={() => (allSelected ? clearSelection() : selectAll())}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              {hasSelection ? `${selectedIds.size} selecionada(s)` : 'Selecionar'}
            </Typography>
          </Box>

          {hasSelection && (
            <>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                onClick={handleDeleteSelected}
                disabled={isDeleting}
              >
                Excluir Selecionadas
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={clearSelection}
              >
                Limpar Selecao
              </Button>
            </>
          )}

          {/* Filtros */}
          <Box sx={{ display: 'flex', gap: 2, ml: 'auto', flexWrap: 'wrap' }}>
            {isMultiCourse && uniqueCourseIds.length > 1 && getCourseNameById && (
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Filtrar por Turma</InputLabel>
                <Select
                  value={filterCourse}
                  label="Filtrar por Turma"
                  onChange={(e) => {
                    setFilterCourse(e.target.value);
                    setFilterTopic('all');
                    clearSelection();
                  }}
                >
                  <MenuItem value="all">Todas as Turmas</MenuItem>
                  {uniqueCourseIds.map((courseId) => (
                    <MenuItem key={courseId} value={courseId}>
                      {getCourseNameById(courseId)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {availableTopics.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Filtrar por Topico</InputLabel>
                <Select
                  value={filterTopic}
                  label="Filtrar por Topico"
                  onChange={(e) => {
                    setFilterTopic(e.target.value);
                    clearSelection();
                  }}
                >
                  <MenuItem value="all">Todos os Topicos</MenuItem>
                  {availableTopics.map((topic) => (
                    <MenuItem key={topic.topicId} value={topic.topicId}>
                      {topic.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Paper>
      )}

      {/* Filtros sem toolbar */}
      {!canDelete && (
        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {isMultiCourse && uniqueCourseIds.length > 1 && getCourseNameById && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Turma</InputLabel>
              <Select
                value={filterCourse}
                label="Filtrar por Turma"
                onChange={(e) => {
                  setFilterCourse(e.target.value);
                  setFilterTopic('all');
                }}
              >
                <MenuItem value="all">Todas as Turmas</MenuItem>
                {uniqueCourseIds.map((courseId) => (
                  <MenuItem key={courseId} value={courseId}>
                    {getCourseNameById(courseId)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {availableTopics.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Topico</InputLabel>
              <Select
                value={filterTopic}
                label="Filtrar por Topico"
                onChange={(e) => setFilterTopic(e.target.value)}
              >
                <MenuItem value="all">Todos os Topicos</MenuItem>
                {availableTopics.map((topic) => (
                  <MenuItem key={topic.topicId} value={topic.topicId}>
                    {topic.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {canDelete && <TableCell padding="checkbox" />}
              <TableCell padding="checkbox" />
              {isMultiCourse && <TableCell>Turma</TableCell>}
              <TableCell>Atividade</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Prazo</TableCell>
              <TableCell align="center">Pontos</TableCell>
              <TableCell>Entregas</TableCell>
              <TableCell align="center">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredWork.map((cw) => (
              <CourseworkRow
                key={`${cw.courseId}-${cw.id}`}
                cw={cw}
                students={students}
                submissions={submissions}
                topics={topics}
                onLoadSubmissions={onLoadSubmissions}
                getSubmissionStats={getSubmissionStats}
                getCourseNameById={getCourseNameById}
                isMultiCourse={isMultiCourse}
                onDeleteCourseWork={onDeleteCourseWork}
                onEditCourseWork={onEditCourseWork}
                canDelete={canDelete}
                canEdit={canEdit}
                isSelected={isSelected(cw)}
                onToggleSelect={() => toggleSelection(cw)}
                isDeleting={isDeleting}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
