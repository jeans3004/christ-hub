/**
 * Timeline de anuncios do Google Classroom.
 * Suporta visualizacao de multiplas turmas com marcadores.
 * Suporta selecao multipla para exclusao em lote e edicao.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Skeleton,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Comment as CommentIcon,
  InsertDriveFile as FileIcon,
  VideoLibrary as VideoIcon,
  Link as LinkIcon,
  Description as FormIcon,
  Add as AddIcon,
  School as SchoolIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  SelectAll as SelectAllIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { classroomSectionService } from '@/services/firestore';
import type { ClassroomAnnouncement, ClassroomMaterial, ClassroomTeacher, CourseSection } from '@/types/classroom';

interface AnnouncementsTimelineProps {
  announcements: ClassroomAnnouncement[];
  teachers?: ClassroomTeacher[];
  isLoading: boolean;
  onNewAnnouncement?: () => void;
  onDeleteAnnouncement?: (courseId: string, announcementId: string) => Promise<void>;
  onDeleteMultipleAnnouncements?: (items: { courseId: string; announcementId: string }[]) => Promise<void>;
  onEditAnnouncement?: (courseId: string, announcementId: string, text: string) => Promise<void>;
  getCourseNameById?: (courseId: string) => string;
  isMultiCourse?: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
}

function MaterialChip({ material }: { material: ClassroomMaterial }) {
  if (material.driveFile) {
    return (
      <Chip
        icon={<FileIcon />}
        label={material.driveFile.driveFile.title}
        size="small"
        component="a"
        href={material.driveFile.driveFile.alternateLink}
        target="_blank"
        clickable
        variant="outlined"
        sx={{ maxWidth: 200 }}
      />
    );
  }

  if (material.youtubeVideo) {
    return (
      <Chip
        icon={<VideoIcon />}
        label={material.youtubeVideo.title}
        size="small"
        component="a"
        href={material.youtubeVideo.alternateLink}
        target="_blank"
        clickable
        variant="outlined"
        color="error"
        sx={{ maxWidth: 200 }}
      />
    );
  }

  if (material.link) {
    return (
      <Chip
        icon={<LinkIcon />}
        label={material.link.title || 'Link'}
        size="small"
        component="a"
        href={material.link.url}
        target="_blank"
        clickable
        variant="outlined"
        color="primary"
        sx={{ maxWidth: 200 }}
      />
    );
  }

  if (material.form) {
    return (
      <Chip
        icon={<FormIcon />}
        label={material.form.title}
        size="small"
        component="a"
        href={material.form.formUrl}
        target="_blank"
        clickable
        variant="outlined"
        color="secondary"
        sx={{ maxWidth: 200 }}
      />
    );
  }

  return null;
}

export function AnnouncementsTimeline({
  announcements,
  teachers = [],
  isLoading,
  onNewAnnouncement,
  onDeleteAnnouncement,
  onDeleteMultipleAnnouncements,
  onEditAnnouncement,
  getCourseNameById,
  isMultiCourse = false,
  canDelete = false,
  canEdit = false,
}: AnnouncementsTimelineProps) {
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<ClassroomAnnouncement | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sections state for resolving targeted sections
  const [sectionsPerCourse, setSectionsPerCourse] = useState<Record<string, CourseSection[]>>({});

  // Load sections for courses present in announcements
  useEffect(() => {
    const courseIds = [...new Set(announcements.map(a => a.courseId))];
    if (courseIds.length === 0) return;

    const loadSections = async () => {
      const map: Record<string, CourseSection[]> = {};
      for (const courseId of courseIds) {
        try {
          const config = await classroomSectionService.getCourseSections(courseId);
          if (config && config.sections.length > 0) {
            map[courseId] = config.sections;
          }
        } catch {
          // Ignore
        }
      }
      setSectionsPerCourse(map);
    };

    loadSections();
  }, [announcements]);

  // Resolve teacher name from creatorUserId
  const getTeacherName = (creatorUserId: string): string | null => {
    const teacher = teachers.find(t => t.userId === creatorUserId);
    return teacher?.profile?.name?.fullName || teacher?.profile?.name?.givenName || null;
  };

  // Resolve section from announcement's individualStudentsOptions
  const getAnnouncementSection = (announcement: ClassroomAnnouncement): CourseSection | null => {
    if (announcement.assigneeMode !== 'INDIVIDUAL_STUDENTS') return null;
    const studentIds = announcement.individualStudentsOptions?.studentIds;
    if (!studentIds || studentIds.length === 0) return null;

    const courseSections = sectionsPerCourse[announcement.courseId];
    if (!courseSections) return null;

    // Find section whose studentIds match the announcement's studentIds
    const announcementStudentSet = new Set(studentIds);
    return courseSections.find(section => {
      if (section.studentIds.length === 0) return false;
      const sectionStudentSet = new Set(section.studentIds);
      if (announcementStudentSet.size !== sectionStudentSet.size) return false;
      return studentIds.every(id => sectionStudentSet.has(id));
    }) || null;
  };

  if (isLoading) {
    return (
      <Box>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  if (announcements.length === 0) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          Nenhum anuncio publicado nas turmas selecionadas.
        </Alert>
        {onNewAnnouncement && (
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={onNewAnnouncement}
          >
            Criar Primeiro Anuncio
          </Button>
        )}
      </Box>
    );
  }

  // Obter lista unica de turmas
  const uniqueCourseIds = [...new Set(announcements.map((a) => a.courseId))];

  // Filtrar por turma
  const filteredAnnouncements = filterCourse === 'all'
    ? announcements
    : announcements.filter((a) => a.courseId === filterCourse);

  // Selection helpers
  const getSelectionKey = (a: ClassroomAnnouncement) => `${a.courseId}::${a.id}`;

  const isSelected = (a: ClassroomAnnouncement) => selectedIds.has(getSelectionKey(a));

  const toggleSelection = (a: ClassroomAnnouncement) => {
    const key = getSelectionKey(a);
    const newSelected = new Set(selectedIds);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const allKeys = filteredAnnouncements.map(getSelectionKey);
    setSelectedIds(new Set(allKeys));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSingle = async (announcement: ClassroomAnnouncement) => {
    if (!onDeleteAnnouncement) return;

    const courseName = getCourseNameById ? getCourseNameById(announcement.courseId) : '';
    const confirmMessage = isMultiCourse && courseName
      ? `Tem certeza que deseja excluir este anuncio da turma "${courseName}"?\n\nEsta acao nao pode ser desfeita.`
      : 'Tem certeza que deseja excluir este anuncio?\n\nEsta acao nao pode ser desfeita.';

    if (!confirm(confirmMessage)) return;

    setDeletingId(announcement.id);
    try {
      await onDeleteAnnouncement(announcement.courseId, announcement.id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (!onDeleteMultipleAnnouncements || selectedIds.size === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir ${selectedIds.size} anuncio(s) selecionado(s)?\n\nEsta acao nao pode ser desfeita.`;
    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      const items = Array.from(selectedIds).map((key) => {
        const [courseId, announcementId] = key.split('::');
        return { courseId, announcementId };
      });
      await onDeleteMultipleAnnouncements(items);
      clearSelection();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEdit = (announcement: ClassroomAnnouncement) => {
    setEditingAnnouncement(announcement);
    setEditText(announcement.text);
    setEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setEditingAnnouncement(null);
    setEditText('');
  };

  const handleSaveEdit = async () => {
    if (!onEditAnnouncement || !editingAnnouncement || !editText.trim()) return;

    setIsSaving(true);
    try {
      await onEditAnnouncement(editingAnnouncement.courseId, editingAnnouncement.id, editText.trim());
      handleCloseEdit();
    } finally {
      setIsSaving(false);
    }
  };

  const hasSelection = selectedIds.size > 0;
  const allSelected = filteredAnnouncements.length > 0 && selectedIds.size === filteredAnnouncements.length;

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
              {hasSelection ? `${selectedIds.size} selecionado(s)` : 'Selecionar'}
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
                Excluir Selecionados
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

          {/* Filtro por turma */}
          {isMultiCourse && uniqueCourseIds.length > 1 && getCourseNameById && (
            <FormControl size="small" sx={{ minWidth: 200, ml: 'auto' }}>
              <InputLabel>Filtrar por Turma</InputLabel>
              <Select
                value={filterCourse}
                label="Filtrar por Turma"
                onChange={(e) => {
                  setFilterCourse(e.target.value);
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
        </Paper>
      )}

      {/* Filtro sem toolbar (quando nao pode deletar) */}
      {!canDelete && isMultiCourse && uniqueCourseIds.length > 1 && getCourseNameById && (
        <Box sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por Turma</InputLabel>
            <Select
              value={filterCourse}
              label="Filtrar por Turma"
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <MenuItem value="all">Todas as Turmas</MenuItem>
              {uniqueCourseIds.map((courseId) => (
                <MenuItem key={courseId} value={courseId}>
                  {getCourseNameById(courseId)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Box sx={{ position: 'relative' }}>
        {/* Linha da timeline */}
        <Box
          sx={{
            position: 'absolute',
            left: canDelete ? 48 : 16,
            top: 0,
            bottom: 0,
            width: 2,
            bgcolor: 'divider',
          }}
        />

        {filteredAnnouncements.map((announcement) => {
          const courseName = getCourseNameById ? getCourseNameById(announcement.courseId) : '';
          const selected = isSelected(announcement);
          const isItemDeleting = deletingId === announcement.id;
          const teacherName = getTeacherName(announcement.creatorUserId);
          const section = getAnnouncementSection(announcement);

          return (
            <Box
              key={`${announcement.courseId}-${announcement.id}`}
              sx={{
                display: 'flex',
                gap: 2,
                mb: 3,
                position: 'relative',
                opacity: isItemDeleting ? 0.5 : 1,
              }}
            >
              {/* Checkbox de selecao */}
              {canDelete && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 1 }}>
                  <Checkbox
                    checked={selected}
                    onChange={() => toggleSelection(announcement)}
                    size="small"
                    disabled={isItemDeleting}
                  />
                </Box>
              )}

              {/* Icone da timeline */}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: selected ? 'primary.light' : 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  zIndex: 1,
                }}
              >
                <CampaignIcon sx={{ color: 'white', fontSize: 18 }} />
              </Box>

              {/* Card do anuncio */}
              <Paper
                sx={{
                  flex: 1,
                  p: 2,
                  '&:hover': { boxShadow: 2 },
                  border: selected ? 2 : 0,
                  borderColor: 'primary.main',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {isMultiCourse && courseName && (
                      <Chip
                        icon={<SchoolIcon />}
                        label={courseName}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    )}
                    {teacherName && (
                      <Chip
                        icon={<PersonIcon />}
                        label={teacherName}
                        size="small"
                        variant="outlined"
                        sx={{ color: 'text.secondary', borderColor: 'divider' }}
                      />
                    )}
                    {section ? (
                      <Chip
                        icon={<GroupsIcon />}
                        label={section.name}
                        size="small"
                        sx={{ bgcolor: section.color, color: '#fff', '& .MuiChip-icon': { color: '#fff' } }}
                      />
                    ) : announcement.assigneeMode !== 'INDIVIDUAL_STUDENTS' ? (
                      <Chip
                        icon={<GroupsIcon />}
                        label="Geral"
                        size="small"
                        variant="outlined"
                        sx={{ color: 'text.secondary', borderColor: 'divider' }}
                      />
                    ) : null}
                    <Typography variant="caption" color="text.secondary">
                      {new Date(announcement.creationTime).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {canEdit && onEditAnnouncement && (
                      <Tooltip title="Editar anuncio">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEdit(announcement)}
                          disabled={isItemDeleting}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Ver comentários no Classroom">
                      <IconButton
                        size="small"
                        onClick={() => window.open(announcement.alternateLink, '_blank')}
                      >
                        <CommentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canDelete && onDeleteAnnouncement && (
                      <Tooltip title="Excluir anuncio">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteSingle(announcement)}
                          disabled={isItemDeleting}
                        >
                          {isItemDeleting ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                <Typography
                  variant="body1"
                  sx={{
                    mt: 1,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {announcement.text}
                </Typography>

                {/* Materiais anexados */}
                {announcement.materials && announcement.materials.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {announcement.materials.map((material, idx) => (
                      <MaterialChip key={idx} material={material} />
                    ))}
                  </Box>
                )}
              </Paper>
            </Box>
          );
        })}
      </Box>

      {/* Modal de edicao */}
      <Dialog open={editModalOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon color="primary" />
              <Typography variant="h6">Editar Anuncio</Typography>
            </Box>
            <IconButton onClick={handleCloseEdit} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          {editingAnnouncement && isMultiCourse && getCourseNameById && (
            <Typography variant="body2" color="text.secondary">
              {getCourseNameById(editingAnnouncement.courseId)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Texto do anuncio"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            sx={{ mt: 1 }}
            disabled={isSaving}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={isSaving || !editText.trim()}
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
