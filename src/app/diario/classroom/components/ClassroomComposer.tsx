/**
 * Compositor avancado para Google Classroom.
 * Suporta anuncios e atividades com multiplas turmas, anexos e templates.
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
  IconButton,
  Tooltip,
  Divider,
  Paper,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Checkbox,
  ListItemText,
  OutlinedInput,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Collapse,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatStrikethrough as StrikeIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  FormatListBulleted as ListIcon,
  Send as SendIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
  Campaign as AnnouncementIcon,
  Assignment as AssignmentIcon,
  Quiz as QuizIcon,
  AttachFile as AttachIcon,
  YouTube as YouTubeIcon,
  InsertDriveFile as DriveIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Schedule as ScheduleIcon,
  Grade as GradeIcon,
  Topic as TopicIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useDriveStore } from '@/store/driveStore';
import { useUIStore } from '@/store/uiStore';
import { classroomTemplateService, classroomSectionService } from '@/services/firestore';
import { createClassroomService } from '@/services/classroomService';
import type {
  ClassroomCourse,
  ClassroomTemplate,
  ClassroomPostType,
  ClassroomAttachment,
  MultiPostResult,
  ClassroomMaterialPayload,
  CourseSection,
  ClassroomTopic,
} from '@/types/classroom';

interface ClassroomComposerProps {
  open: boolean;
  onClose: () => void;
  courses: ClassroomCourse[];
  topics?: ClassroomTopic[];
  defaultCourseId?: string;
  onSuccess: () => void;
  userId: string;
  userName: string;
}

type TabValue = 'compose' | 'templates';

export function ClassroomComposer({
  open,
  onClose,
  courses,
  topics: allTopics = [],
  defaultCourseId,
  onSuccess,
  userId,
  userName,
}: ClassroomComposerProps) {
  const { accessToken } = useDriveStore();
  const { addToast } = useUIStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabValue>('compose');

  // Form state
  const [postType, setPostType] = useState<ClassroomPostType>('announcement');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(
    defaultCourseId ? [defaultCourseId] : []
  );
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ClassroomAttachment[]>([]);
  const [maxPoints, setMaxPoints] = useState<number>(100);
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('23:59');
  const [questionType, setQuestionType] = useState<'SHORT_ANSWER_QUESTION' | 'MULTIPLE_CHOICE_QUESTION'>('SHORT_ANSWER_QUESTION');
  const [choices, setChoices] = useState<string[]>(['', '']);

  // UI state
  const [isPreview, setIsPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<MultiPostResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Templates state
  const [templates, setTemplates] = useState<ClassroomTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Section state
  const [sectionsPerCourse, setSectionsPerCourse] = useState<Record<string, CourseSection[]>>({});
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Topic state
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [topicWarning, setTopicWarning] = useState(false);

  // Topic-section mapping state
  const [topicSectionMapPerCourse, setTopicSectionMapPerCourse] = useState<Record<string, Record<string, string>>>({});

  // Attachment dialog state
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [attachType, setAttachType] = useState<'link' | 'youtubeVideo'>('link');
  const [attachUrl, setAttachUrl] = useState('');
  const [attachTitle, setAttachTitle] = useState('');

  // Load templates
  useEffect(() => {
    if (open && activeTab === 'templates') {
      loadTemplates();
    }
  }, [open, activeTab]);

  // Load sections and topicSectionMap for selected courses
  useEffect(() => {
    if (!open || selectedCourseIds.length === 0) {
      setSectionsPerCourse({});
      setSelectedSectionId(null);
      setTopicSectionMapPerCourse({});
      return;
    }

    const loadSections = async () => {
      const map: Record<string, CourseSection[]> = {};
      const tsmMap: Record<string, Record<string, string>> = {};
      for (const courseId of selectedCourseIds) {
        try {
          const config = await classroomSectionService.getCourseSections(courseId);
          if (config) {
            if (config.sections.length > 0) {
              map[courseId] = config.sections;
            }
            if (config.topicSectionMap) {
              tsmMap[courseId] = config.topicSectionMap;
            }
          }
        } catch {
          // Ignore errors loading sections
        }
      }
      setSectionsPerCourse(map);
      setTopicSectionMapPerCourse(tsmMap);
      setSelectedSectionId(null);
    };

    loadSections();
  }, [open, selectedCourseIds]);

  // Reset defaultCourseId when it changes
  useEffect(() => {
    if (defaultCourseId && !selectedCourseIds.includes(defaultCourseId)) {
      setSelectedCourseIds([defaultCourseId]);
    }
  }, [defaultCourseId]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await classroomTemplateService.getByTipo(postType);
      setTemplates(data);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Apply formatting
  const applyFormat = useCallback(
    (format: 'bold' | 'italic' | 'strike' | 'code' | 'link' | 'list') => {
      const textarea = document.getElementById('composer-text') as HTMLTextAreaElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = text.substring(start, end);

      let newText = '';

      switch (format) {
        case 'bold':
          newText = `*${selectedText}*`;
          break;
        case 'italic':
          newText = `_${selectedText}_`;
          break;
        case 'strike':
          newText = `~${selectedText}~`;
          break;
        case 'code':
          newText = selectedText.includes('\n') ? `\`\`\`\n${selectedText}\n\`\`\`` : `\`${selectedText}\``;
          break;
        case 'link':
          const url = prompt('Digite a URL:');
          if (url) {
            newText = `${selectedText} (${url})`;
          } else {
            return;
          }
          break;
        case 'list':
          const lines = selectedText.split('\n');
          newText = lines.map((line) => `• ${line}`).join('\n');
          break;
        default:
          return;
      }

      const beforeSelection = text.substring(0, start);
      const afterSelection = text.substring(end);
      setText(beforeSelection + newText + afterSelection);
    },
    [text]
  );

  // Format preview
  const formatPreview = (content: string): string => {
    if (!content) return '';
    let formatted = content;
    formatted = formatted.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');
    formatted = formatted.replace(/~([^~]+)~/g, '<s>$1</s>');
    formatted = formatted.replace(/```\n?([\s\S]*?)\n?```/g, '<pre style="background:#f5f5f5;padding:8px;border-radius:4px;"><code>$1</code></pre>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:#f5f5f5;padding:2px 4px;border-radius:2px;">$1</code>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  };

  // Add attachment
  const handleAddAttachment = () => {
    if (!attachUrl.trim()) return;

    const newAttach: ClassroomAttachment = {
      type: attachType,
      url: attachUrl.trim(),
      title: attachTitle.trim() || undefined,
    };

    if (attachType === 'youtubeVideo') {
      // Extract YouTube video ID
      const match = attachUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
      if (match) {
        newAttach.youtubeVideoId = match[1];
      }
    }

    setAttachments([...attachments, newAttach]);
    setAttachDialogOpen(false);
    setAttachUrl('');
    setAttachTitle('');
  };

  // Remove attachment
  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Convert attachments to API format
  const convertAttachmentsToMaterials = (): ClassroomMaterialPayload[] => {
    return attachments.map((attach) => {
      if (attach.type === 'link') {
        return { link: { url: attach.url!, title: attach.title } };
      }
      if (attach.type === 'youtubeVideo' && attach.youtubeVideoId) {
        return { youtubeVideo: { id: attach.youtubeVideoId } };
      }
      if (attach.type === 'driveFile' && attach.driveFileId) {
        return { driveFile: { driveFile: { id: attach.driveFileId } } };
      }
      return { link: { url: attach.url! } };
    });
  };

  // Compute available sections across selected courses
  const allCoursesHaveSections = selectedCourseIds.length > 0 &&
    selectedCourseIds.every(id => sectionsPerCourse[id]?.length > 0);

  const availableSections: CourseSection[] = (() => {
    if (!allCoursesHaveSections) return [];

    if (selectedCourseIds.length === 1) {
      return sectionsPerCourse[selectedCourseIds[0]] || [];
    }

    // Multi-course: find sections with matching names across all courses
    const firstCourseSections = sectionsPerCourse[selectedCourseIds[0]] || [];
    return firstCourseSections.filter(section =>
      selectedCourseIds.slice(1).every(courseId =>
        (sectionsPerCourse[courseId] || []).some(s => s.name === section.name)
      )
    );
  })();

  // Compute available topics for selected courses
  const availableTopics = allTopics.filter(t => selectedCourseIds.includes(t.courseId));

  // Resolve studentIds for a section across courses
  const resolveStudentIds = (sectionId: string | null, courseId: string): string[] | null => {
    if (!sectionId) return null; // "Geral" = ALL_STUDENTS

    const courseSections = sectionsPerCourse[courseId];
    if (!courseSections) return null;

    // Match by ID first, then by name (for cross-course matching)
    let section = courseSections.find(s => s.id === sectionId);
    if (!section) {
      const selectedSection = availableSections.find(s => s.id === sectionId);
      if (selectedSection) {
        section = courseSections.find(s => s.name === selectedSection.name);
      }
    }

    return section?.studentIds || null;
  };

  // Send to selected courses
  const handleSend = async () => {
    if (selectedCourseIds.length === 0) {
      addToast('Selecione pelo menos uma turma', 'warning');
      return;
    }

    if (!text.trim() && postType === 'announcement') {
      addToast('Digite o conteudo', 'warning');
      return;
    }

    if (!title.trim() && postType !== 'announcement') {
      addToast('Digite o titulo da atividade', 'warning');
      return;
    }

    if (postType !== 'announcement' && !selectedTopicId && availableTopics.length > 0) {
      setTopicWarning(true);
      addToast('Selecione um tema para a atividade', 'warning');
      return;
    }

    if (!accessToken) {
      setError('Token de acesso nao disponivel. Faca login novamente.');
      return;
    }

    setIsSending(true);
    setError(null);
    setResults([]);
    setShowResults(false);

    const service = createClassroomService(accessToken);
    const materials = convertAttachmentsToMaterials();
    const postResults: MultiPostResult[] = [];

    for (const courseId of selectedCourseIds) {
      const course = courses.find((c) => c.id === courseId);
      const courseName = course?.name || courseId;

      try {
        // Resolve section targeting
        let effectiveSectionId = selectedSectionId;

        // For assignments/questions, auto-resolve section from topic
        if (postType !== 'announcement' && selectedTopicId) {
          const selectedTopic = allTopics.find(t => t.topicId === selectedTopicId);
          if (selectedTopic) {
            // Find the matching topic in this course (may differ by ID across courses)
            const courseTopicMatch = allTopics.find(
              t => t.courseId === courseId && (t.topicId === selectedTopicId || t.name === selectedTopic.name)
            );
            if (courseTopicMatch) {
              const mappedSectionId = topicSectionMapPerCourse[courseId]?.[courseTopicMatch.topicId];
              if (mappedSectionId) {
                effectiveSectionId = mappedSectionId;
              }
            }
          }
        }

        const studentIds = resolveStudentIds(effectiveSectionId, courseId);
        const assigneeFields = studentIds
          ? {
              assigneeMode: 'INDIVIDUAL_STUDENTS' as const,
              individualStudentsOptions: { studentIds },
            }
          : {};

        if (postType === 'announcement') {
          await service.createAnnouncement(courseId, {
            text: text.trim(),
            materials: materials.length > 0 ? materials : undefined,
            ...assigneeFields,
          });
        } else {
          // Parse due date
          let parsedDueDate;
          let parsedDueTime;
          if (dueDate) {
            const [year, month, day] = dueDate.split('-').map(Number);
            parsedDueDate = { year, month, day };
            if (dueTime) {
              const [hours, minutes] = dueTime.split(':').map(Number);
              parsedDueTime = { hours, minutes };
            }
          }

          // Resolve topicId for this course
          let resolvedTopicId: string | undefined;
          if (selectedTopicId) {
            const selectedTopic = allTopics.find(t => t.topicId === selectedTopicId);
            if (selectedTopic) {
              // If same course, use directly; otherwise find by name
              const courseTopicMatch = allTopics.find(
                t => t.courseId === courseId && (t.topicId === selectedTopicId || t.name === selectedTopic.name)
              );
              resolvedTopicId = courseTopicMatch?.topicId;
            }
          }

          await service.createCourseWork(courseId, {
            title: title.trim(),
            description: text.trim() || undefined,
            materials: materials.length > 0 ? materials : undefined,
            workType: postType === 'question' ? questionType : 'ASSIGNMENT',
            maxPoints: postType === 'assignment' ? maxPoints : undefined,
            dueDate: parsedDueDate,
            dueTime: parsedDueTime,
            topicId: resolvedTopicId,
            multipleChoiceQuestion: questionType === 'MULTIPLE_CHOICE_QUESTION' && postType === 'question'
              ? { choices: choices.filter((c) => c.trim()) }
              : undefined,
            ...assigneeFields,
          });
        }

        postResults.push({ courseId, courseName, success: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        postResults.push({ courseId, courseName, success: false, error: message });
      }
    }

    setResults(postResults);
    setShowResults(true);
    setIsSending(false);

    const successCount = postResults.filter((r) => r.success).length;
    const failCount = postResults.filter((r) => !r.success).length;

    if (failCount === 0) {
      addToast(`Publicado com sucesso em ${successCount} turma(s)!`, 'success');
      handleReset();
      onSuccess();
    } else if (successCount > 0) {
      addToast(`Publicado em ${successCount} turma(s), ${failCount} erro(s)`, 'warning');
    } else {
      addToast('Erro ao publicar em todas as turmas', 'error');
    }
  };

  // Save as template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      addToast('Digite um nome para o template', 'warning');
      return;
    }

    setSavingTemplate(true);
    try {
      await classroomTemplateService.create({
        nome: templateName.trim(),
        tipo: postType,
        texto: text,
        anexos: attachments.length > 0 ? attachments : undefined,
        pontuacao: postType === 'assignment' ? maxPoints : undefined,
        prazoEmDias: dueDate ? undefined : undefined,
        criadoPorId: userId,
        criadoPorNome: userName,
        ativo: true,
      });

      addToast('Template salvo com sucesso!', 'success');
      setShowSaveTemplate(false);
      setTemplateName('');
      loadTemplates();
    } catch (err) {
      addToast('Erro ao salvar template', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Load template
  const handleLoadTemplate = async (template: ClassroomTemplate) => {
    setPostType(template.tipo);
    setText(template.texto);
    setAttachments(template.anexos || []);
    if (template.pontuacao) setMaxPoints(template.pontuacao);
    setActiveTab('compose');

    // Increment usage
    await classroomTemplateService.incrementUsage(template.id);
    addToast(`Template "${template.nome}" carregado`, 'info');
  };

  // Delete template
  const handleDeleteTemplate = async (template: ClassroomTemplate) => {
    if (!confirm(`Excluir template "${template.nome}"?`)) return;

    try {
      await classroomTemplateService.deactivate(template.id);
      addToast('Template excluido', 'success');
      loadTemplates();
    } catch (err) {
      addToast('Erro ao excluir template', 'error');
    }
  };

  // Resolve auto-linked section name for display
  const resolvedSectionName = (() => {
    if (postType === 'announcement' || !selectedTopicId || selectedCourseIds.length === 0) return null;
    const firstCourseId = selectedCourseIds[0];
    const selectedTopic = allTopics.find(t => t.topicId === selectedTopicId);
    if (!selectedTopic) return null;
    const courseTopicMatch = allTopics.find(
      t => t.courseId === firstCourseId && (t.topicId === selectedTopicId || t.name === selectedTopic.name)
    );
    if (!courseTopicMatch) return null;
    const mappedSectionId = topicSectionMapPerCourse[firstCourseId]?.[courseTopicMatch.topicId];
    if (!mappedSectionId) return null;
    const section = (sectionsPerCourse[firstCourseId] || []).find(s => s.id === mappedSectionId);
    return section || null;
  })();

  // Reset form
  const handleReset = () => {
    setTitle('');
    setText('');
    setAttachments([]);
    setMaxPoints(100);
    setDueDate('');
    setDueTime('23:59');
    setChoices(['', '']);
    setResults([]);
    setShowResults(false);
    setIsPreview(false);
    setError(null);
    setSelectedSectionId(null);
    setSelectedTopicId(null);
    setTopicWarning(false);
  };

  // Close handler
  const handleClose = () => {
    if (isSending) return;
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Publicar no Classroom</Typography>
          <Chip
            label={`${selectedCourseIds.length} turma(s)`}
            size="small"
            color={selectedCourseIds.length > 0 ? 'primary' : 'default'}
          />
        </Box>
      </DialogTitle>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 3 }}>
        <Tab label="Compor" value="compose" />
        <Tab label="Templates" value="templates" />
      </Tabs>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {showResults && results.length > 0 && (
          <Alert
            severity={results.every((r) => r.success) ? 'success' : 'warning'}
            sx={{ mb: 2 }}
            action={
              <IconButton size="small" onClick={() => setShowResults(false)}>
                <CollapseIcon />
              </IconButton>
            }
          >
            <Typography variant="subtitle2">Resultados:</Typography>
            {results.map((r) => (
              <Typography key={r.courseId} variant="body2">
                {r.courseName}: {r.success ? 'Sucesso' : `Erro - ${r.error}`}
              </Typography>
            ))}
          </Alert>
        )}

        {activeTab === 'compose' && (
          <Box>
            {/* Post type selection */}
            <ToggleButtonGroup
              value={postType}
              exclusive
              onChange={(_, v) => v && setPostType(v)}
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="announcement">
                <AnnouncementIcon sx={{ mr: 0.5 }} fontSize="small" />
                Anuncio
              </ToggleButton>
              <ToggleButton value="assignment">
                <AssignmentIcon sx={{ mr: 0.5 }} fontSize="small" />
                Atividade
              </ToggleButton>
              <ToggleButton value="question">
                <QuizIcon sx={{ mr: 0.5 }} fontSize="small" />
                Pergunta
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Course selection */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Turmas</InputLabel>
              <Select
                multiple
                value={selectedCourseIds}
                onChange={(e) => setSelectedCourseIds(e.target.value as string[])}
                input={<OutlinedInput label="Turmas" />}
                renderValue={(selected) =>
                  selected.map((id) => courses.find((c) => c.id === id)?.name || id).join(', ')
                }
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    <Checkbox checked={selectedCourseIds.includes(course.id)} />
                    <ListItemText primary={course.name} secondary={course.section} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Section selector (announcements only) */}
            {postType === 'announcement' && availableSections.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Direcionar para:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Chip
                    label="Geral"
                    size="small"
                    variant={selectedSectionId === null ? 'filled' : 'outlined'}
                    color={selectedSectionId === null ? 'primary' : 'default'}
                    onClick={() => setSelectedSectionId(null)}
                  />
                  {availableSections.map(section => (
                    <Chip
                      key={section.id}
                      label={section.name}
                      size="small"
                      variant={selectedSectionId === section.id ? 'filled' : 'outlined'}
                      onClick={() => setSelectedSectionId(section.id)}
                      sx={{
                        borderColor: section.color,
                        ...(selectedSectionId === section.id
                          ? { bgcolor: section.color, color: '#fff' }
                          : { color: section.color }),
                      }}
                    />
                  ))}
                </Box>
                {selectedSectionId && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Publicacao sera direcionada apenas aos alunos desta secao
                  </Typography>
                )}
              </Box>
            )}

            {/* Topic selector (for assignments/questions only) */}
            {postType !== 'announcement' && availableTopics.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <TopicIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    Tema *
                  </Typography>
                </Box>
                <FormControl fullWidth size="small" error={topicWarning && !selectedTopicId}>
                  <InputLabel>Selecionar Tema</InputLabel>
                  <Select
                    value={selectedTopicId || ''}
                    label="Selecionar Tema"
                    onChange={(e) => {
                      setSelectedTopicId(e.target.value || null);
                      setTopicWarning(false);
                    }}
                  >
                    {(() => {
                      // Deduplicate topics by name for multi-course
                      const seen = new Set<string>();
                      return availableTopics.filter(t => {
                        if (seen.has(t.name)) return false;
                        seen.add(t.name);
                        return true;
                      }).map(topic => (
                        <MenuItem key={topic.topicId} value={topic.topicId}>
                          {topic.name}
                        </MenuItem>
                      ));
                    })()}
                  </Select>
                </FormControl>
                {topicWarning && !selectedTopicId && (
                  <Alert severity="warning" icon={<WarningIcon fontSize="small" />} sx={{ mt: 1 }}>
                    Selecione um tema antes de publicar a atividade.
                  </Alert>
                )}
                {resolvedSectionName && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Direcionado para:
                    <Chip
                      size="small"
                      label={resolvedSectionName.name}
                      sx={{ bgcolor: resolvedSectionName.color, color: '#fff', height: 20, fontSize: '0.7rem' }}
                    />
                  </Typography>
                )}
              </Box>
            )}

            {/* Title (for assignments/questions) */}
            {postType !== 'announcement' && (
              <TextField
                fullWidth
                size="small"
                label="Titulo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}

            {/* Assignment options */}
            {postType === 'assignment' && (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Pontuacao"
                    type="number"
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><GradeIcon fontSize="small" /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Data de entrega"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Horario"
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            )}

            {/* Question options */}
            {postType === 'question' && (
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Tipo de pergunta</InputLabel>
                  <Select
                    value={questionType}
                    label="Tipo de pergunta"
                    onChange={(e) => setQuestionType(e.target.value as typeof questionType)}
                  >
                    <MenuItem value="SHORT_ANSWER_QUESTION">Resposta curta</MenuItem>
                    <MenuItem value="MULTIPLE_CHOICE_QUESTION">Multipla escolha</MenuItem>
                  </Select>
                </FormControl>

                {questionType === 'MULTIPLE_CHOICE_QUESTION' && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Opcoes:</Typography>
                    {choices.map((choice, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label={`Opcao ${index + 1}`}
                          value={choice}
                          onChange={(e) => {
                            const newChoices = [...choices];
                            newChoices[index] = e.target.value;
                            setChoices(newChoices);
                          }}
                        />
                        {choices.length > 2 && (
                          <IconButton
                            size="small"
                            onClick={() => setChoices(choices.filter((_, i) => i !== index))}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                    {choices.length < 5 && (
                      <Button size="small" onClick={() => setChoices([...choices, ''])}>
                        + Adicionar opcao
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Formatting toolbar */}
            <Paper variant="outlined" sx={{ p: 1, mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Tooltip title="Negrito">
                <IconButton size="small" onClick={() => applyFormat('bold')}>
                  <BoldIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Italico">
                <IconButton size="small" onClick={() => applyFormat('italic')}>
                  <ItalicIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Tachado">
                <IconButton size="small" onClick={() => applyFormat('strike')}>
                  <StrikeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Codigo">
                <IconButton size="small" onClick={() => applyFormat('code')}>
                  <CodeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Link">
                <IconButton size="small" onClick={() => applyFormat('link')}>
                  <LinkIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Lista">
                <IconButton size="small" onClick={() => applyFormat('list')}>
                  <ListIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <Tooltip title="Adicionar anexo">
                <IconButton size="small" onClick={() => setAttachDialogOpen(true)}>
                  <AttachIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Box sx={{ flex: 1 }} />
              <ToggleButtonGroup
                size="small"
                value={isPreview ? 'preview' : 'edit'}
                exclusive
                onChange={(_, v) => v && setIsPreview(v === 'preview')}
              >
                <ToggleButton value="edit">
                  <EditIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="preview">
                  <PreviewIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            </Paper>

            {/* Text editor / preview */}
            {isPreview ? (
              <Paper variant="outlined" sx={{ p: 2, minHeight: 150, bgcolor: 'background.default' }}>
                {text ? (
                  <Box dangerouslySetInnerHTML={{ __html: formatPreview(text) }} />
                ) : (
                  <Typography color="text.secondary" fontStyle="italic">
                    Nenhum conteudo
                  </Typography>
                )}
              </Paper>
            ) : (
              <TextField
                id="composer-text"
                multiline
                fullWidth
                rows={6}
                placeholder={postType === 'announcement' ? 'Digite o anuncio...' : 'Descricao (opcional)...'}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isSending}
              />
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Anexos:</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {attachments.map((attach, index) => (
                    <Chip
                      key={index}
                      label={attach.title || attach.url}
                      icon={attach.type === 'youtubeVideo' ? <YouTubeIcon /> : <LinkIcon />}
                      onDelete={() => handleRemoveAttachment(index)}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Save as template */}
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                startIcon={<SaveIcon />}
                onClick={() => setShowSaveTemplate(!showSaveTemplate)}
              >
                Salvar como template
              </Button>
              <Collapse in={showSaveTemplate}>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField
                    size="small"
                    label="Nome do template"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate || !templateName.trim()}
                  >
                    {savingTemplate ? <CircularProgress size={20} /> : 'Salvar'}
                  </Button>
                </Box>
              </Collapse>
            </Box>
          </Box>
        )}

        {/* Templates tab */}
        {activeTab === 'templates' && (
          <Box>
            {loadingTemplates ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : templates.length === 0 ? (
              <Alert severity="info">
                Nenhum template salvo. Crie um na aba &quot;Compor&quot;.
              </Alert>
            ) : (
              <List>
                {templates.map((template) => (
                  <ListItem
                    key={template.id}
                    disablePadding
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleDeleteTemplate(template)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemButton onClick={() => handleLoadTemplate(template)}>
                      <ListItemIcon>
                        {template.tipo === 'announcement' ? (
                          <AnnouncementIcon />
                        ) : template.tipo === 'assignment' ? (
                          <AssignmentIcon />
                        ) : (
                          <QuizIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={template.nome}
                        secondary={
                          <>
                            {template.tipo === 'announcement' ? 'Anuncio' : template.tipo === 'assignment' ? 'Atividade' : 'Pergunta'}
                            {' • '}
                            Usado {template.usageCount}x
                            {template.anexos && template.anexos.length > 0 && (
                              <> • {template.anexos.length} anexo(s)</>
                            )}
                          </>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSending}>
          Cancelar
        </Button>
        {activeTab === 'compose' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={handleSend}
            disabled={isSending || selectedCourseIds.length === 0}
          >
            {isSending ? 'Publicando...' : `Publicar em ${selectedCourseIds.length} turma(s)`}
          </Button>
        )}
      </DialogActions>

      {/* Attachment dialog */}
      <Dialog open={attachDialogOpen} onClose={() => setAttachDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Anexo</DialogTitle>
        <DialogContent>
          <ToggleButtonGroup
            value={attachType}
            exclusive
            onChange={(_, v) => v && setAttachType(v)}
            size="small"
            sx={{ mb: 2, mt: 1 }}
            fullWidth
          >
            <ToggleButton value="link">
              <LinkIcon sx={{ mr: 0.5 }} fontSize="small" />
              Link
            </ToggleButton>
            <ToggleButton value="youtubeVideo">
              <YouTubeIcon sx={{ mr: 0.5 }} fontSize="small" />
              YouTube
            </ToggleButton>
          </ToggleButtonGroup>

          <TextField
            fullWidth
            size="small"
            label={attachType === 'youtubeVideo' ? 'URL do video' : 'URL'}
            value={attachUrl}
            onChange={(e) => setAttachUrl(e.target.value)}
            placeholder={attachType === 'youtubeVideo' ? 'https://youtube.com/watch?v=...' : 'https://...'}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            size="small"
            label="Titulo (opcional)"
            value={attachTitle}
            onChange={(e) => setAttachTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddAttachment} disabled={!attachUrl.trim()}>
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
