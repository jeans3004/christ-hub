/**
 * Modal para convidar alunos para turmas do Google Classroom.
 * Permite convidar e ja atribuir o aluno a uma secao do curso.
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
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  School as SchoolIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { classroomSectionService } from '@/services/firestore';
import { useDriveStore } from '@/store/driveStore';
import { useUIStore } from '@/store/uiStore';
import { createClassroomService } from '@/services/classroomService';
import type { ClassroomCourse, CourseSection } from '@/types/classroom';

interface InviteStudentModalProps {
  open: boolean;
  onClose: () => void;
  courses: ClassroomCourse[];
  onStudentInvited: () => void;
}

interface InviteResult {
  courseId: string;
  success: boolean;
  error?: string;
  userId?: string;
}

export function InviteStudentModal({
  open,
  onClose,
  courses,
  onStudentInvited,
}: InviteStudentModalProps) {
  const { accessToken } = useDriveStore();
  const { addToast } = useUIStore();

  const [email, setEmail] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [sectionsPerCourse, setSectionsPerCourse] = useState<Record<string, CourseSection[]>>({});
  const [selectedSectionIds, setSelectedSectionIds] = useState<Record<string, string>>({});
  const [isInviting, setIsInviting] = useState(false);
  const [results, setResults] = useState<InviteResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load sections for all courses when modal opens
  useEffect(() => {
    if (!open) return;

    const loadSections = async () => {
      const map: Record<string, CourseSection[]> = {};
      for (const course of courses) {
        try {
          const config = await classroomSectionService.getCourseSections(course.id);
          if (config && config.sections.length > 0) {
            map[course.id] = config.sections;
          }
        } catch {
          // ignore
        }
      }
      setSectionsPerCourse(map);
    };

    loadSections();
  }, [open, courses]);

  const handleClose = () => {
    if (isInviting) return;
    setEmail('');
    setSelectedCourseIds([]);
    setSelectedSectionIds({});
    setResults(null);
    setError(null);
    onClose();
  };

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
    setResults(null);
  };

  const handleSelectAll = () => {
    if (selectedCourseIds.length === courses.length) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(courses.map((c) => c.id));
    }
    setResults(null);
  };

  const handleSectionChange = (courseId: string, sectionId: string) => {
    setSelectedSectionIds(prev => ({
      ...prev,
      [courseId]: sectionId,
    }));
  };

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleInvite = async () => {
    if (!email.trim()) {
      setError('Digite o email do aluno');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Email invalido');
      return;
    }
    if (selectedCourseIds.length === 0) {
      setError('Selecione pelo menos uma turma');
      return;
    }
    if (!accessToken) {
      setError('Token de acesso nao disponivel');
      return;
    }

    setIsInviting(true);
    setError(null);
    setResults(null);

    const service = createClassroomService(accessToken);
    const inviteResults: InviteResult[] = [];

    for (const courseId of selectedCourseIds) {
      try {
        const invitation = await service.inviteStudent(courseId, email.trim());
        inviteResults.push({ courseId, success: true, userId: invitation.userId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        inviteResults.push({ courseId, success: false, error: message });
      }
    }

    // For successful invites, add student to selected section
    for (const result of inviteResults) {
      if (!result.success || !result.userId) continue;

      const sectionId = selectedSectionIds[result.courseId];
      if (!sectionId || sectionId === '__none__') continue;

      const courseSections = sectionsPerCourse[result.courseId];
      if (!courseSections) continue;

      try {
        const updatedSections = courseSections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              studentIds: s.studentIds.includes(result.userId!)
                ? s.studentIds
                : [...s.studentIds, result.userId!],
            };
          }
          return s;
        });

        await classroomSectionService.saveCourseSections(result.courseId, updatedSections);
        // Update local state too
        setSectionsPerCourse(prev => ({
          ...prev,
          [result.courseId]: updatedSections,
        }));
      } catch {
        // Section save failed but invite succeeded — not critical
      }
    }

    setResults(inviteResults);

    const successCount = inviteResults.filter(r => r.success).length;
    const errorCount = inviteResults.filter(r => !r.success).length;

    if (errorCount === 0) {
      addToast(`Aluno convidado para ${successCount} turma(s)!`, 'success');
      setEmail('');
      setSelectedCourseIds([]);
      setSelectedSectionIds({});
      onStudentInvited();
    } else if (successCount > 0) {
      addToast(`${successCount} convite(s) enviado(s), ${errorCount} erro(s)`, 'warning');
      onStudentInvited();
    } else {
      addToast('Erro ao convidar aluno', 'error');
    }

    setIsInviting(false);
  };

  const getCourseNameById = (courseId: string) =>
    courses.find(c => c.id === courseId)?.name || courseId;

  const successCount = results?.filter(r => r.success).length || 0;
  const errorCount = results?.filter(r => !r.success).length || 0;
  const allSelected = selectedCourseIds.length === courses.length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="primary" />
            <Typography variant="h6">Convidar Aluno</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" disabled={isInviting}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {results && (
          <Alert
            severity={errorCount === 0 ? 'success' : successCount > 0 ? 'warning' : 'error'}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2" fontWeight={500}>
              {errorCount === 0
                ? `Aluno convidado para ${successCount} turma(s) com sucesso!`
                : successCount > 0
                  ? `${successCount} convite(s) enviado(s), ${errorCount} erro(s)`
                  : 'Erro ao enviar convites'}
            </Typography>
            {errorCount > 0 && (
              <Box sx={{ mt: 1 }}>
                {results.filter(r => !r.success).map(r => (
                  <Typography key={r.courseId} variant="caption" display="block" color="error">
                    {getCourseNameById(r.courseId)}: {r.error}
                  </Typography>
                ))}
              </Box>
            )}
          </Alert>
        )}

        {/* Email do aluno */}
        <TextField
          fullWidth
          label="Email do Aluno"
          placeholder="aluno@escola.edu.br"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
            setResults(null);
          }}
          disabled={isInviting}
          InputProps={{
            startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
          }}
          sx={{ mb: 3 }}
          helperText="O aluno recebera um convite por email"
        />

        <Divider sx={{ mb: 2 }} />

        {/* Selecao de turmas com secao */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">
            Turmas e Secoes ({selectedCourseIds.length} de {courses.length})
          </Typography>
          <Button size="small" onClick={handleSelectAll}>
            {allSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
          </Button>
        </Box>

        <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
          <List dense disablePadding>
            {courses.map((course) => {
              const isSelected = selectedCourseIds.includes(course.id);
              const courseSections = sectionsPerCourse[course.id];
              const hasSections = courseSections && courseSections.length > 0;
              const result = results?.find(r => r.courseId === course.id);

              return (
                <Box key={course.id}>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      result && (
                        result.success
                          ? <SuccessIcon color="success" fontSize="small" />
                          : <ErrorIcon color="error" fontSize="small" />
                      )
                    }
                  >
                    <ListItemButton
                      onClick={() => handleToggleCourse(course.id)}
                      disabled={isInviting}
                      selected={isSelected}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Checkbox
                          edge="start"
                          checked={isSelected}
                          tabIndex={-1}
                          disableRipple
                          disabled={isInviting}
                        />
                      </ListItemIcon>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <SchoolIcon color={isSelected ? 'primary' : 'action'} fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={course.name}
                        secondary={course.section}
                        primaryTypographyProps={{ fontWeight: isSelected ? 500 : 400 }}
                      />
                    </ListItemButton>
                  </ListItem>

                  {/* Section selector — only when course is selected and has sections */}
                  {isSelected && hasSections && (
                    <Box sx={{ pl: 9, pr: 2, pb: 1.5, pt: 0.5 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Secao</InputLabel>
                        <Select
                          value={selectedSectionIds[course.id] || '__none__'}
                          label="Secao"
                          onChange={(e) => handleSectionChange(course.id, e.target.value)}
                          disabled={isInviting}
                        >
                          <MenuItem value="__none__">
                            <Typography variant="body2" color="text.secondary">
                              Sem secao
                            </Typography>
                          </MenuItem>
                          {courseSections!.map(section => (
                            <MenuItem key={section.id} value={section.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    bgcolor: section.color,
                                    flexShrink: 0,
                                  }}
                                />
                                <Typography variant="body2">
                                  {section.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ({section.studentIds.length})
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                </Box>
              );
            })}
          </List>
        </Paper>

        {selectedCourseIds.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selectedCourseIds.map(id => {
              const sectionId = selectedSectionIds[id];
              const section = sectionId && sectionId !== '__none__'
                ? sectionsPerCourse[id]?.find(s => s.id === sectionId)
                : null;

              return (
                <Chip
                  key={id}
                  label={
                    section
                      ? `${getCourseNameById(id)} → ${section.name}`
                      : getCourseNameById(id)
                  }
                  size="small"
                  onDelete={() => handleToggleCourse(id)}
                  disabled={isInviting}
                  sx={section ? {
                    borderLeft: `3px solid ${section.color}`,
                  } : undefined}
                />
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isInviting}>
          {results && successCount > 0 ? 'Fechar' : 'Cancelar'}
        </Button>
        <Button
          variant="contained"
          onClick={handleInvite}
          disabled={isInviting || !email.trim() || selectedCourseIds.length === 0}
          startIcon={isInviting ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
        >
          {isInviting ? 'Convidando...' : `Convidar para ${selectedCourseIds.length} Turma(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
