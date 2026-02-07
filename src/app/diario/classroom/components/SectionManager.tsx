/**
 * Gerenciador de secoes (areas do conhecimento) para cursos do Google Classroom.
 * Permite configurar secoes para direcionar publicacoes a grupos de alunos.
 * Suporta auto-populacao para cursos FPA via match com alunos internos.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Alert,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Checkbox,
  Tabs,
  Tab,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AutoFixHigh as AutoPopulateIcon,
  Save as SaveIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Group as GroupIcon,
  Category as CategoryIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useDriveStore } from '@/store/driveStore';
import { useUIStore } from '@/store/uiStore';
import { classroomSectionService } from '@/services/firestore';
import { alunoService } from '@/services/firestore';
import { createClassroomService } from '@/services/classroomService';
import { AREAS_CONHECIMENTO } from '@/constants/areasConhecimento';
import type {
  ClassroomCourse,
  ClassroomStudent,
  CourseSection,
} from '@/types/classroom';

interface SectionManagerProps {
  open: boolean;
  onClose: () => void;
  courses: ClassroomCourse[];
  students: ClassroomStudent[];
  onSectionsUpdated: () => void;
}

const isFPACourse = (name: string) =>
  name.toLowerCase().includes('formação profissional') ||
  name.toLowerCase().includes('formacao profissional');

const FPA_AREAS = AREAS_CONHECIMENTO.filter(a => a.id !== 'formacao_tecnica');

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function SectionManager({
  open,
  onClose,
  courses,
  students,
  onSectionsUpdated,
}: SectionManagerProps) {
  const { accessToken } = useDriveStore();
  const { addToast } = useUIStore();

  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [sectionsMap, setSectionsMap] = useState<Record<string, CourseSection[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionColor, setNewSectionColor] = useState('#607D8B');
  const [hasChanges, setHasChanges] = useState(false);
  const [showStudentManager, setShowStudentManager] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const selectedCourse = courses[selectedCourseIndex];
  const currentSections = selectedCourse ? (sectionsMap[selectedCourse.id] || []) : [];
  const courseStudents = selectedCourse
    ? students.filter(s => s.courseId === selectedCourse.id)
    : [];

  // Load sections when modal opens
  useEffect(() => {
    if (open && courses.length > 0) {
      loadAllSections();
    }
  }, [open, courses]);

  const loadAllSections = async () => {
    setIsLoading(true);
    try {
      const map: Record<string, CourseSection[]> = {};

      for (const course of courses) {
        const config = await classroomSectionService.getCourseSections(course.id);
        if (config) {
          map[course.id] = config.sections;
        } else if (isFPACourse(course.name)) {
          // Pre-create FPA sections
          map[course.id] = FPA_AREAS.map(area => ({
            id: area.id,
            name: area.nome,
            color: area.cor,
            studentIds: [],
          }));
        }
      }

      setSectionsMap(map);
      setHasChanges(false);
    } catch (err) {
      console.error('Erro ao carregar secoes:', err);
      addToast('Erro ao carregar secoes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoPopulate = useCallback(async () => {
    if (!selectedCourse) return;

    setIsAutoPopulating(true);
    try {
      // Load all active high school students with areaConhecimentoId
      const allAlunos = await alunoService.getEnsinoMedio();
      const alunosWithArea = allAlunos.filter(a => a.areaConhecimentoId);

      // Load classroom students for this course if not already loaded
      let classroomStudents = courseStudents;
      if (classroomStudents.length === 0 && accessToken) {
        const service = createClassroomService(accessToken);
        classroomStudents = await service.listStudents(selectedCourse.id);
      }

      // Build email -> areaConhecimentoId map using all available emails
      const emailToArea = new Map<string, string>();
      const nameToArea = new Map<string, string>();

      for (const aluno of alunosWithArea) {
        // Match by name (primary)
        if (aluno.nome) {
          nameToArea.set(normalizeName(aluno.nome), aluno.areaConhecimentoId!);
        }
        // Match by any email (secondary)
        const emails = [aluno.responsavelEmail, aluno.paiEmail, aluno.maeEmail].filter(Boolean);
        for (const email of emails) {
          emailToArea.set(email!.toLowerCase(), aluno.areaConhecimentoId!);
        }
      }

      // Match classroom students to sections
      const sectionStudentIds: Record<string, string[]> = {};
      let matchCount = 0;

      for (const cs of classroomStudents) {
        const email = cs.profile.emailAddress?.toLowerCase();
        const name = normalizeName(cs.profile.name.fullName);

        // Try email match first, then name match
        let areaId = email ? emailToArea.get(email) : undefined;
        if (!areaId) {
          areaId = nameToArea.get(name);
        }

        if (areaId) {
          if (!sectionStudentIds[areaId]) sectionStudentIds[areaId] = [];
          sectionStudentIds[areaId].push(cs.userId);
          matchCount++;
        }
      }

      // Update sections with matched student IDs
      const updatedSections = (sectionsMap[selectedCourse.id] || []).map(section => ({
        ...section,
        studentIds: sectionStudentIds[section.id] || section.studentIds,
      }));

      setSectionsMap(prev => ({
        ...prev,
        [selectedCourse.id]: updatedSections,
      }));
      setHasChanges(true);

      addToast(
        `${matchCount} aluno(s) mapeados automaticamente de ${classroomStudents.length} total`,
        matchCount > 0 ? 'success' : 'warning'
      );
    } catch (err) {
      console.error('Erro ao auto-popular:', err);
      addToast('Erro ao auto-popular secoes', 'error');
    } finally {
      setIsAutoPopulating(false);
    }
  }, [selectedCourse, courseStudents, sectionsMap, accessToken, addToast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const course of courses) {
        const sections = sectionsMap[course.id];
        if (sections && sections.length > 0) {
          await classroomSectionService.saveCourseSections(course.id, sections);
        } else {
          await classroomSectionService.deleteCourseSections(course.id);
        }
      }

      setHasChanges(false);
      addToast('Secoes salvas com sucesso!', 'success');
      onSectionsUpdated();
    } catch (err) {
      console.error('Erro ao salvar secoes:', err);
      addToast('Erro ao salvar secoes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = () => {
    if (!newSectionName.trim() || !selectedCourse) return;

    const newSection: CourseSection = {
      id: `custom_${Date.now()}`,
      name: newSectionName.trim(),
      color: newSectionColor,
      studentIds: [],
    };

    setSectionsMap(prev => ({
      ...prev,
      [selectedCourse.id]: [...(prev[selectedCourse.id] || []), newSection],
    }));
    setNewSectionName('');
    setNewSectionColor('#607D8B');
    setHasChanges(true);
  };

  const handleRemoveSection = (sectionId: string) => {
    if (!selectedCourse) return;

    setSectionsMap(prev => ({
      ...prev,
      [selectedCourse.id]: (prev[selectedCourse.id] || []).filter(s => s.id !== sectionId),
    }));
    setHasChanges(true);
  };

  const handleToggleStudent = (sectionId: string, studentUserId: string) => {
    if (!selectedCourse) return;

    setSectionsMap(prev => {
      const sections = [...(prev[selectedCourse.id] || [])];
      const sectionIndex = sections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return prev;

      const section = { ...sections[sectionIndex] };
      const studentIndex = section.studentIds.indexOf(studentUserId);

      if (studentIndex === -1) {
        section.studentIds = [...section.studentIds, studentUserId];
      } else {
        section.studentIds = section.studentIds.filter(id => id !== studentUserId);
      }

      sections[sectionIndex] = section;
      return { ...prev, [selectedCourse.id]: sections };
    });
    setHasChanges(true);
  };

  const getStudentSections = (userId: string): CourseSection[] => {
    return currentSections.filter(s => s.studentIds.includes(userId));
  };

  const handleToggleStudentSection = (studentUserId: string, sectionId: string) => {
    if (!selectedCourse) return;

    setSectionsMap(prev => {
      const sections = [...(prev[selectedCourse.id] || [])];
      const targetIndex = sections.findIndex(s => s.id === sectionId);
      if (targetIndex === -1) return prev;

      const target = sections[targetIndex];
      const isInSection = target.studentIds.includes(studentUserId);

      sections[targetIndex] = {
        ...target,
        studentIds: isInSection
          ? target.studentIds.filter(id => id !== studentUserId)
          : [...target.studentIds, studentUserId],
      };

      return { ...prev, [selectedCourse.id]: sections };
    });
    setHasChanges(true);
  };

  const getUnassignedStudents = (): ClassroomStudent[] => {
    const allAssigned = new Set(
      currentSections.flatMap(s => s.studentIds)
    );
    return courseStudents.filter(s => !allAssigned.has(s.userId));
  };

  const filteredStudents = courseStudents.filter(s => {
    if (!studentSearch.trim()) return true;
    const search = studentSearch.toLowerCase();
    return (
      s.profile.name.fullName.toLowerCase().includes(search) ||
      s.profile.emailAddress?.toLowerCase().includes(search)
    );
  });

  const handleClose = () => {
    if (hasChanges) {
      if (!confirm('Existem alteracoes nao salvas. Deseja sair sem salvar?')) return;
    }
    setHasChanges(false);
    setExpandedSection(null);
    setNewSectionName('');
    setShowStudentManager(false);
    setStudentSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryIcon color="primary" />
            <Typography variant="h6">Secoes por Area</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Course tabs when multiple courses */}
      {courses.length > 1 && (
        <Tabs
          value={selectedCourseIndex}
          onChange={(_, v) => {
            setSelectedCourseIndex(v);
            setExpandedSection(null);
            setShowStudentManager(false);
            setStudentSearch('');
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 3 }}
        >
          {courses.map((course, i) => (
            <Tab
              key={course.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{course.name}</span>
                  {sectionsMap[course.id]?.length ? (
                    <Chip
                      label={sectionsMap[course.id].length}
                      size="small"
                      color="primary"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  ) : null}
                </Box>
              }
              value={i}
            />
          ))}
        </Tabs>
      )}

      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : !selectedCourse ? (
          <Alert severity="info">Selecione um curso para configurar secoes.</Alert>
        ) : (
          <Box>
            {/* Course info */}
            <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedCourse.name}
              {isFPACourse(selectedCourse.name) && (
                <Chip label="FPA" size="small" color="warning" sx={{ height: 20 }} />
              )}
              <span>{' — '}{courseStudents.length} aluno(s) no Classroom</span>
            </Typography>

            {/* Auto-populate button for FPA courses */}
            {isFPACourse(selectedCourse.name) && currentSections.length > 0 && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={isAutoPopulating ? <CircularProgress size={18} /> : <AutoPopulateIcon />}
                onClick={handleAutoPopulate}
                disabled={isAutoPopulating}
                sx={{ mb: 2 }}
                fullWidth
              >
                {isAutoPopulating ? 'Mapeando alunos...' : 'Auto-popular por Area do Conhecimento'}
              </Button>
            )}

            {/* Existing sections */}
            {currentSections.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Nenhuma secao configurada para este curso.
                {isFPACourse(selectedCourse.name)
                  ? ' As areas serao pre-criadas automaticamente ao salvar.'
                  : ' Adicione secoes customizadas abaixo.'}
              </Alert>
            ) : (
              <List disablePadding sx={{ mb: 2 }}>
                {currentSections.map((section) => {
                  const isExpanded = expandedSection === section.id;

                  return (
                    <Paper
                      key={section.id}
                      variant="outlined"
                      sx={{ mb: 1, overflow: 'hidden' }}
                    >
                      <ListItem
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                        secondaryAction={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip
                              icon={<GroupIcon />}
                              label={`${section.studentIds.length} aluno(s)`}
                              size="small"
                              variant="outlined"
                            />
                            <Tooltip title="Remover secao">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSection(section.id);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <IconButton size="small">
                              {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                            </IconButton>
                          </Box>
                        }
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: section.color,
                            mr: 1.5,
                            flexShrink: 0,
                          }}
                        />
                        <ListItemText
                          primary={section.name}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                      </ListItem>

                      <Collapse in={isExpanded}>
                        <Divider />
                        <Box sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Alunos nesta secao:
                          </Typography>

                          {courseStudents.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              Nenhum aluno carregado. Selecione o curso na aba Turmas primeiro.
                            </Typography>
                          ) : (
                            <List dense disablePadding>
                              {courseStudents.map(student => {
                                const isInSection = section.studentIds.includes(student.userId);
                                return (
                                  <ListItem
                                    key={student.userId}
                                    disablePadding
                                    sx={{ py: 0.25 }}
                                  >
                                    <Checkbox
                                      size="small"
                                      checked={isInSection}
                                      onChange={() => handleToggleStudent(section.id, student.userId)}
                                    />
                                    <ListItemText
                                      primary={student.profile.name.fullName}
                                      secondary={student.profile.emailAddress}
                                      primaryTypographyProps={{ variant: 'body2' }}
                                      secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                  </ListItem>
                                );
                              })}
                            </List>
                          )}
                        </Box>
                      </Collapse>
                    </Paper>
                  );
                })}
              </List>
            )}

            {/* Manage students button + panel */}
            {currentSections.length > 0 && courseStudents.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {(() => {
                  const unassigned = getUnassignedStudents();
                  if (unassigned.length > 0 && !showStudentManager) {
                    return (
                      <Alert severity="warning" sx={{ mb: 1 }}>
                        {unassigned.length} aluno(s) sem secao
                      </Alert>
                    );
                  }
                  return null;
                })()}

                <Button
                  variant={showStudentManager ? 'contained' : 'outlined'}
                  color="primary"
                  startIcon={<PersonAddIcon />}
                  onClick={() => {
                    setShowStudentManager(!showStudentManager);
                    setStudentSearch('');
                  }}
                  fullWidth
                  sx={{ mb: showStudentManager ? 2 : 0 }}
                >
                  {showStudentManager
                    ? 'Ocultar lista de alunos'
                    : `Gerenciar Alunos (${courseStudents.length})`}
                </Button>

                <Collapse in={showStudentManager}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Buscar aluno por nome ou email..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                      sx={{ mb: 2 }}
                    />

                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                      <List dense disablePadding>
                        {filteredStudents.map(student => {
                          const studentSections = getStudentSections(student.userId);
                          return (
                            <ListItem
                              key={student.userId}
                              sx={{
                                py: 0.75,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                flexWrap: 'wrap',
                                gap: 1,
                              }}
                              disablePadding
                            >
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" noWrap>
                                  {student.profile.name.fullName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {student.profile.emailAddress}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {currentSections.map(section => {
                                  const isActive = studentSections.some(s => s.id === section.id);
                                  return (
                                    <Chip
                                      key={section.id}
                                      label={section.name}
                                      size="small"
                                      variant={isActive ? 'filled' : 'outlined'}
                                      onClick={() => handleToggleStudentSection(student.userId, section.id)}
                                      sx={{
                                        cursor: 'pointer',
                                        bgcolor: isActive ? section.color : 'transparent',
                                        color: isActive ? '#fff' : 'text.primary',
                                        borderColor: section.color,
                                        fontWeight: isActive ? 500 : 400,
                                        '&:hover': {
                                          bgcolor: isActive ? section.color : `${section.color}22`,
                                        },
                                      }}
                                    />
                                  );
                                })}
                              </Box>
                            </ListItem>
                          );
                        })}
                      </List>

                      {filteredStudents.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          Nenhum aluno encontrado
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Collapse>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Add custom section */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AddIcon fontSize="small" />
                Adicionar secao
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nome da secao"
                  placeholder="Ex: Turma A"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSectionName.trim()) handleAddSection();
                  }}
                />
                <TextField
                  size="small"
                  type="color"
                  label="Cor"
                  value={newSectionColor}
                  onChange={(e) => setNewSectionColor(e.target.value)}
                  sx={{ width: 80 }}
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddSection}
                  disabled={!newSectionName.trim()}
                  sx={{ minWidth: 80 }}
                >
                  Criar
                </Button>
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
