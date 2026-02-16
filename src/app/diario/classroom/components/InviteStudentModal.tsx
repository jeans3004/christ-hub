/**
 * Modal para convidar alunos para turmas do Google Classroom.
 * Permite convidar e ja atribuir o aluno a uma secao do curso.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  email: string;
  courseId: string;
  success: boolean;
  alreadyEnrolled?: boolean;
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

  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [sectionsPerCourse, setSectionsPerCourse] = useState<Record<string, CourseSection[]>>({});
  const [selectedSectionIds, setSelectedSectionIds] = useState<Record<string, string>>({});
  const [isInviting, setIsInviting] = useState(false);
  const [results, setResults] = useState<InviteResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

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
    setEmails([]);
    setEmailInput('');
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

  // Parse a raw string into individual emails
  const parseEmails = useCallback((text: string): string[] => {
    return text
      .split(/[\s,;\n\r\t]+/)
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0 && s.includes('@'));
  }, []);

  // Add emails from input, avoiding duplicates
  const addEmails = useCallback((raw: string) => {
    const parsed = parseEmails(raw);
    if (parsed.length === 0) return;
    setEmails(prev => {
      const set = new Set(prev);
      for (const e of parsed) set.add(e);
      return Array.from(set);
    });
    setEmailInput('');
    setError(null);
    setResults(null);
  }, [parseEmails]);

  const removeEmail = (emailToRemove: string) => {
    setEmails(prev => prev.filter(e => e !== emailToRemove));
    setResults(null);
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault();
      if (emailInput.trim()) {
        addEmails(emailInput);
      }
    }
    if (e.key === 'Backspace' && !emailInput && emails.length > 0) {
      setEmails(prev => prev.slice(0, -1));
    }
  };

  const handleEmailPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    addEmails(pasted);
  };

  const handleInvite = async () => {
    // Flush any pending input
    if (emailInput.trim()) {
      addEmails(emailInput);
    }
    const allEmails = emailInput.trim()
      ? [...new Set([...emails, ...parseEmails(emailInput)])]
      : emails;

    if (allEmails.length === 0) {
      setError('Digite ou cole o(s) email(s) do(s) aluno(s)');
      return;
    }
    const invalid = allEmails.filter(e => !validateEmail(e));
    if (invalid.length > 0) {
      setError(`Email(s) invalido(s): ${invalid.join(', ')}`);
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

    setEmails(allEmails);
    setEmailInput('');
    setIsInviting(true);
    setError(null);
    setResults(null);

    const service = createClassroomService(accessToken);
    const inviteResults: InviteResult[] = [];

    for (const studentEmail of allEmails) {
      for (const courseId of selectedCourseIds) {
        try {
          const invitation = await service.inviteStudent(courseId, studentEmail);
          inviteResults.push({ email: studentEmail, courseId, success: true, userId: invitation.userId });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erro desconhecido';
          const isAlreadyEnrolled = message.includes('@StudentRoleAlreadyAdded')
            || message.includes('already has the course role');
          inviteResults.push({
            email: studentEmail,
            courseId,
            success: isAlreadyEnrolled,
            alreadyEnrolled: isAlreadyEnrolled,
            error: isAlreadyEnrolled ? undefined : message,
          });
        }
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
        setSectionsPerCourse(prev => ({
          ...prev,
          [result.courseId]: updatedSections,
        }));
      } catch {
        // Section save failed but invite succeeded — not critical
      }
    }

    setResults(inviteResults);

    const newInvites = inviteResults.filter(r => r.success && !r.alreadyEnrolled).length;
    const alreadyIn = inviteResults.filter(r => r.alreadyEnrolled).length;
    const errors = inviteResults.filter(r => !r.success).length;

    if (errors === 0 && newInvites > 0) {
      const msg = alreadyIn > 0
        ? `${newInvites} convite(s) enviado(s), ${alreadyIn} ja na turma`
        : `${newInvites} convite(s) enviado(s) com sucesso!`;
      addToast(msg, 'success');
      setEmails([]);
      setSelectedCourseIds([]);
      setSelectedSectionIds({});
      onStudentInvited();
    } else if (errors === 0 && alreadyIn > 0) {
      addToast(`${alreadyIn} aluno(s) ja matriculado(s)`, 'info');
    } else if (newInvites > 0 || alreadyIn > 0) {
      addToast(`${newInvites} convite(s), ${alreadyIn} ja na turma, ${errors} erro(s)`, 'warning');
      onStudentInvited();
    } else {
      addToast('Erro ao convidar aluno(s)', 'error');
    }

    setIsInviting(false);
  };

  const getCourseNameById = (courseId: string) =>
    courses.find(c => c.id === courseId)?.name || courseId;

  const successCount = results?.filter(r => r.success && !r.alreadyEnrolled).length || 0;
  const alreadyCount = results?.filter(r => r.alreadyEnrolled).length || 0;
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
              {successCount > 0 && `${successCount} convite(s) enviado(s)`}
              {successCount > 0 && alreadyCount > 0 && ', '}
              {alreadyCount > 0 && `${alreadyCount} ja na turma`}
              {(successCount > 0 || alreadyCount > 0) && errorCount > 0 && ', '}
              {errorCount > 0 && `${errorCount} erro(s)`}
              {successCount === 0 && alreadyCount === 0 && errorCount === 0 && 'Nenhum resultado'}
            </Typography>
            {alreadyCount > 0 && (
              <Box sx={{ mt: 1 }}>
                {results.filter(r => r.alreadyEnrolled).map((r, i) => (
                  <Typography key={`already-${r.email}-${r.courseId}-${i}`} variant="caption" display="block" color="text.secondary">
                    {r.email} → {getCourseNameById(r.courseId)}: ja matriculado
                  </Typography>
                ))}
              </Box>
            )}
            {errorCount > 0 && (
              <Box sx={{ mt: 1 }}>
                {results.filter(r => !r.success).map((r, i) => (
                  <Typography key={`err-${r.email}-${r.courseId}-${i}`} variant="caption" display="block" color="error">
                    {r.email} → {getCourseNameById(r.courseId)}: {r.error}
                  </Typography>
                ))}
              </Box>
            )}
          </Alert>
        )}

        {/* Email(s) do(s) aluno(s) — chip input */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 0.5,
            p: 1,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1,
            cursor: 'text',
            minHeight: 48,
            '&:focus-within': { borderColor: 'primary.main', borderWidth: 2, p: 'calc(8px - 1px)' },
          }}
          onClick={() => emailInputRef.current?.focus()}
        >
          <EmailIcon color="action" sx={{ mr: 0.5 }} />
          {emails.map((e) => (
            <Chip
              key={e}
              label={e}
              size="small"
              onDelete={isInviting ? undefined : () => removeEmail(e)}
              color={validateEmail(e) ? 'default' : 'error'}
              variant="outlined"
            />
          ))}
          <Box
            component="input"
            ref={emailInputRef}
            value={emailInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEmailInput(e.target.value);
              setError(null);
              setResults(null);
            }}
            onKeyDown={handleEmailKeyDown}
            onPaste={handleEmailPaste}
            onBlur={() => { if (emailInput.trim()) addEmails(emailInput); }}
            disabled={isInviting}
            placeholder={emails.length === 0 ? 'Cole ou digite emails separados por virgula' : ''}
            sx={{
              border: 'none',
              outline: 'none',
              flex: 1,
              minWidth: 180,
              fontSize: 14,
              fontFamily: 'inherit',
              bgcolor: 'transparent',
              color: 'text.primary',
              '&::placeholder': { color: 'text.secondary', opacity: 0.7 },
              '&:disabled': { color: 'text.disabled' },
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Cole varios emails de uma vez (separados por virgula, espaco ou quebra de linha)
          {emails.length > 0 && ` — ${emails.length} email(s)`}
        </Typography>

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
          disabled={isInviting || (emails.length === 0 && !emailInput.trim()) || selectedCourseIds.length === 0}
          startIcon={isInviting ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
        >
          {isInviting
            ? 'Convidando...'
            : emails.length > 1
              ? `Convidar ${emails.length} aluno(s) para ${selectedCourseIds.length} turma(s)`
              : `Convidar para ${selectedCourseIds.length} turma(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
