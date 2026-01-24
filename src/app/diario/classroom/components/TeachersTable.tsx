/**
 * Tabela de professores do Google Classroom.
 * Suporta visualizacao de multiplas turmas com agrupamento.
 * Mostra professores ativos e convites pendentes.
 */

'use client';

import { useState, useMemo } from 'react';
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
  Avatar,
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  HourglassEmpty as PendingIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import type { ClassroomTeacher, ClassroomInvitationWithProfile } from '@/types/classroom';

interface TeachersTableProps {
  teachers: ClassroomTeacher[];
  invitations?: ClassroomInvitationWithProfile[];
  isLoading: boolean;
  getCourseNameById?: (courseId: string) => string;
  isMultiCourse?: boolean;
  onCancelInvitation?: (invitationId: string) => Promise<void>;
}

export function TeachersTable({
  teachers,
  invitations = [],
  isLoading,
  getCourseNameById,
  isMultiCourse = false,
  onCancelInvitation,
}: TeachersTableProps) {
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Filtrar apenas convites de professores
  const teacherInvitations = useMemo(() => {
    return invitations.filter((inv) => inv.role === 'TEACHER');
  }, [invitations]);

  // Agrupar professores por turma
  const teachersByCourse = useMemo(() => {
    const grouped: Record<string, ClassroomTeacher[]> = {};
    for (const teacher of teachers) {
      if (!grouped[teacher.courseId]) {
        grouped[teacher.courseId] = [];
      }
      grouped[teacher.courseId].push(teacher);
    }
    return grouped;
  }, [teachers]);

  // Agrupar convites por turma
  const invitationsByCourse = useMemo(() => {
    const grouped: Record<string, ClassroomInvitationWithProfile[]> = {};
    for (const inv of teacherInvitations) {
      if (!grouped[inv.courseId]) {
        grouped[inv.courseId] = [];
      }
      grouped[inv.courseId].push(inv);
    }
    return grouped;
  }, [teacherInvitations]);

  // Obter professores unicos (mesmo professor pode estar em multiplas turmas)
  const uniqueTeachers = useMemo(() => {
    const seen = new Map<string, ClassroomTeacher & { courseIds: string[] }>();
    for (const teacher of teachers) {
      const existing = seen.get(teacher.userId);
      if (existing) {
        existing.courseIds.push(teacher.courseId);
      } else {
        seen.set(teacher.userId, { ...teacher, courseIds: [teacher.courseId] });
      }
    }
    return Array.from(seen.values());
  }, [teachers]);

  const handleCancelInvitation = async (invitationId: string) => {
    if (!onCancelInvitation) return;
    setCancelingId(invitationId);
    try {
      await onCancelInvitation(invitationId);
    } finally {
      setCancelingId(null);
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={53} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    );
  }

  if (teachers.length === 0 && teacherInvitations.length === 0) {
    return <Alert severity="info">Nenhum professor encontrado nas turmas selecionadas.</Alert>;
  }

  // Obter lista unica de turmas (incluindo turmas com convites pendentes)
  const uniqueCourseIds = [...new Set([
    ...teachers.map((t) => t.courseId),
    ...teacherInvitations.map((i) => i.courseId),
  ])];

  // Filtrar por busca
  const filterTeachers = (teacherList: ClassroomTeacher[]) => {
    if (!search) return teacherList;
    return teacherList.filter(
      (t) =>
        t.profile.name.fullName.toLowerCase().includes(search.toLowerCase()) ||
        t.profile.emailAddress.toLowerCase().includes(search.toLowerCase())
    );
  };

  // Para visualizacao em lista
  let filteredTeachers = teachers;
  if (filterCourse !== 'all') {
    filteredTeachers = filteredTeachers.filter((t) => t.courseId === filterCourse);
  }
  if (search) {
    filteredTeachers = filterTeachers(filteredTeachers);
  }

  return (
    <Box>
      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        {/* Modo de visualizacao (apenas se multiplas turmas) */}
        {isMultiCourse && uniqueCourseIds.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Visualizacao</InputLabel>
            <Select
              value={viewMode}
              label="Visualizacao"
              onChange={(e) => setViewMode(e.target.value as 'list' | 'grouped')}
            >
              <MenuItem value="grouped">Agrupado por Turma</MenuItem>
              <MenuItem value="list">Lista Unica</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Filtro por turma (apenas no modo lista) */}
        {isMultiCourse && viewMode === 'list' && uniqueCourseIds.length > 1 && getCourseNameById && (
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
        )}

        {/* Campo de busca */}
        <TextField
          size="small"
          placeholder="Buscar professor por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 250 }}
        />
      </Box>

      {/* Visualizacao agrupada por turma */}
      {isMultiCourse && viewMode === 'grouped' && uniqueCourseIds.length > 1 ? (
        <Box>
          {uniqueCourseIds.map((courseId) => {
            const courseTeachers = filterTeachers(teachersByCourse[courseId] || []);
            const courseInvitations = invitationsByCourse[courseId] || [];
            const courseName = getCourseNameById ? getCourseNameById(courseId) : courseId;

            if (courseTeachers.length === 0 && courseInvitations.length === 0 && search) return null;

            return (
              <Accordion key={courseId} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SchoolIcon color="primary" />
                    <Typography fontWeight={500}>{courseName}</Typography>
                    <Chip
                      label={`${courseTeachers.length} professor(es)`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    {courseInvitations.length > 0 && (
                      <Chip
                        icon={<PendingIcon />}
                        label={`${courseInvitations.length} pendente(s)`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {courseTeachers.length === 0 && courseInvitations.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Nenhum professor encontrado para a busca.
                    </Typography>
                  ) : (
                    <>
                      {courseTeachers.length > 0 && (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell width={60}>#</TableCell>
                                <TableCell>Professor</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell width={100}>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {courseTeachers.map((teacher, index) => (
                                <TableRow key={`${courseId}-${teacher.userId}`} hover>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <Avatar
                                        src={teacher.profile.photoUrl}
                                        alt={teacher.profile.name.fullName}
                                        sx={{ width: 32, height: 32 }}
                                      >
                                        {teacher.profile.name.givenName?.charAt(0)}
                                      </Avatar>
                                      <Typography variant="body2">
                                        {teacher.profile.name.fullName}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                      {teacher.profile.emailAddress}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip label="Ativo" size="small" color="success" />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}

                      {/* Convites pendentes */}
                      {courseInvitations.length > 0 && (
                        <>
                          {courseTeachers.length > 0 && <Divider sx={{ my: 2 }} />}
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Convites Pendentes
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell width={60}>#</TableCell>
                                  <TableCell>Email</TableCell>
                                  <TableCell width={100}>Status</TableCell>
                                  {onCancelInvitation && <TableCell width={80}>Acoes</TableCell>}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {courseInvitations.map((inv, index) => (
                                  <TableRow key={inv.id} hover>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        {inv.profile?.photoUrl ? (
                                          <Avatar
                                            src={inv.profile.photoUrl}
                                            sx={{ width: 32, height: 32 }}
                                          >
                                            {inv.profile.name?.givenName?.charAt(0)}
                                          </Avatar>
                                        ) : (
                                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'warning.main' }}>
                                            <PendingIcon sx={{ fontSize: 18 }} />
                                          </Avatar>
                                        )}
                                        <Box>
                                          <Typography variant="body2">
                                            {inv.profile?.name?.fullName || 'Usuario convidado'}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {inv.profile?.emailAddress || inv.userId}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        icon={<PendingIcon />}
                                        label="Pendente"
                                        size="small"
                                        color="warning"
                                      />
                                    </TableCell>
                                    {onCancelInvitation && (
                                      <TableCell>
                                        <Tooltip title="Cancelar convite">
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleCancelInvitation(inv.id)}
                                            disabled={cancelingId === inv.id}
                                          >
                                            <CancelIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      )}
                    </>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}

          {/* Resumo de professores unicos */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Resumo
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<PersonIcon />}
                label={`${uniqueTeachers.length} professor(es) unico(s)`}
                color="primary"
              />
              {teacherInvitations.length > 0 && (
                <Chip
                  icon={<PendingIcon />}
                  label={`${teacherInvitations.length} convite(s) pendente(s)`}
                  color="warning"
                />
              )}
              <Chip
                icon={<SchoolIcon />}
                label={`${uniqueCourseIds.length} turma(s)`}
                variant="outlined"
              />
            </Box>

            {/* Professores que estao em multiplas turmas */}
            {uniqueTeachers.some((t) => t.courseIds.length > 1) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Professores em multiplas turmas:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {uniqueTeachers
                    .filter((t) => t.courseIds.length > 1)
                    .map((teacher) => (
                      <Chip
                        key={teacher.userId}
                        avatar={
                          <Avatar src={teacher.profile.photoUrl}>
                            {teacher.profile.name.givenName?.charAt(0)}
                          </Avatar>
                        }
                        label={`${teacher.profile.name.fullName} (${teacher.courseIds.length} turmas)`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      ) : (
        /* Visualizacao em lista unica */
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={60}>#</TableCell>
                  {isMultiCourse && <TableCell>Turma</TableCell>}
                  <TableCell>Professor</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell width={100}>Status</TableCell>
                  {onCancelInvitation && <TableCell width={80}>Acoes</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Professores ativos */}
                {filteredTeachers.map((teacher, index) => {
                  const courseName = getCourseNameById
                    ? getCourseNameById(teacher.courseId)
                    : '';

                  return (
                    <TableRow key={`${teacher.courseId}-${teacher.userId}`} hover>
                      <TableCell>{index + 1}</TableCell>
                      {isMultiCourse && (
                        <TableCell>
                          <Chip
                            icon={<SchoolIcon />}
                            label={courseName}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={teacher.profile.photoUrl}
                            alt={teacher.profile.name.fullName}
                            sx={{ width: 32, height: 32 }}
                          >
                            {teacher.profile.name.givenName?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{teacher.profile.name.fullName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {teacher.profile.emailAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label="Ativo" size="small" color="success" />
                      </TableCell>
                      {onCancelInvitation && <TableCell />}
                    </TableRow>
                  );
                })}

                {/* Convites pendentes */}
                {teacherInvitations.map((inv, index) => {
                  const courseName = getCourseNameById
                    ? getCourseNameById(inv.courseId)
                    : '';

                  return (
                    <TableRow key={inv.id} hover>
                      <TableCell>{filteredTeachers.length + index + 1}</TableCell>
                      {isMultiCourse && (
                        <TableCell>
                          <Chip
                            icon={<SchoolIcon />}
                            label={courseName}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {inv.profile?.photoUrl ? (
                            <Avatar
                              src={inv.profile.photoUrl}
                              sx={{ width: 32, height: 32 }}
                            >
                              {inv.profile.name?.givenName?.charAt(0)}
                            </Avatar>
                          ) : (
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'warning.main' }}>
                              <PendingIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                          )}
                          <Typography variant="body2">
                            {inv.profile?.name?.fullName || 'Usuario convidado'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {inv.profile?.emailAddress || inv.userId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<PendingIcon />}
                          label="Pendente"
                          size="small"
                          color="warning"
                        />
                      </TableCell>
                      {onCancelInvitation && (
                        <TableCell>
                          <Tooltip title="Cancelar convite">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancelInvitation(inv.id)}
                              disabled={cancelingId === inv.id}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}

                {filteredTeachers.length === 0 && teacherInvitations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isMultiCourse ? 6 : 5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Nenhum professor encontrado para &quot;{search}&quot;
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Total: {filteredTeachers.length} professor(es) ativo(s)
            {teacherInvitations.length > 0 && `, ${teacherInvitations.length} convite(s) pendente(s)`}
          </Typography>
        </>
      )}
    </Box>
  );
}
