/**
 * Tabela de alunos do Google Classroom.
 * Suporta visualizacao de multiplas turmas com marcadores.
 */

'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  School as SchoolIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as AcceptedIcon,
} from '@mui/icons-material';
import { classroomSectionService } from '@/services/firestore';
import type { ClassroomStudent, ClassroomInvitationWithProfile, CourseSection } from '@/types/classroom';

interface StudentsTableProps {
  students: ClassroomStudent[];
  invitations?: ClassroomInvitationWithProfile[];
  isLoading: boolean;
  getCourseNameById?: (courseId: string) => string;
  isMultiCourse?: boolean;
  sectionsVersion?: number;
}

export function StudentsTable({
  students,
  invitations = [],
  isLoading,
  getCourseNameById,
  isMultiCourse = false,
  sectionsVersion = 0,
}: StudentsTableProps) {
  // Filter invitations to only STUDENT role that aren't already in students list
  const pendingInvitations = invitations.filter(inv =>
    inv.role === 'STUDENT' && inv.profile && !students.some(s => s.userId === inv.userId && s.courseId === inv.courseId)
  );
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sectionsMap, setSectionsMap] = useState<Record<string, CourseSection[]>>({});
  const [filterSection, setFilterSection] = useState<string>('all');

  // Load sections for all courses present in students
  useEffect(() => {
    const courseIds = [...new Set(students.map(s => s.courseId))];
    if (courseIds.length === 0) return;

    const load = async () => {
      const map: Record<string, CourseSection[]> = {};
      for (const courseId of courseIds) {
        try {
          const config = await classroomSectionService.getCourseSections(courseId);
          if (config && config.sections.length > 0) {
            map[courseId] = config.sections;
          }
        } catch {
          // ignore
        }
      }
      setSectionsMap(map);
    };

    load();
  }, [students, sectionsVersion]);

  const hasSections = Object.keys(sectionsMap).length > 0;

  const getStudentSections = (courseId: string, userId: string): CourseSection[] => {
    const sections = sectionsMap[courseId];
    if (!sections) return [];
    return sections.filter(s => s.studentIds.includes(userId));
  };

  // Collect all unique section names for filter
  const allSectionNames = hasSections
    ? [...new Set(Object.values(sectionsMap).flatMap(sections => sections.map(s => s.name)))]
    : [];

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rectangular" height={53} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    );
  }

  if (students.length === 0 && pendingInvitations.length === 0) {
    return <Alert severity="info">Nenhum aluno matriculado nas turmas selecionadas.</Alert>;
  }

  // Build unified rows: enrolled students + pending invitations
  type StudentRow = {
    key: string;
    courseId: string;
    userId: string;
    fullName: string;
    email: string;
    photoUrl?: string;
    initials: string;
    status: 'enrolled' | 'pending';
  };

  const enrolledRows: StudentRow[] = students.map(s => ({
    key: `enrolled-${s.courseId}-${s.userId}`,
    courseId: s.courseId,
    userId: s.userId,
    fullName: s.profile.name.fullName,
    email: s.profile.emailAddress,
    photoUrl: s.profile.photoUrl,
    initials: s.profile.name.givenName?.charAt(0) || '?',
    status: 'enrolled',
  }));

  const pendingRows: StudentRow[] = pendingInvitations.map(inv => ({
    key: `pending-${inv.courseId}-${inv.userId}`,
    courseId: inv.courseId,
    userId: inv.userId,
    fullName: inv.profile?.name.fullName || inv.userId,
    email: inv.profile?.emailAddress || '',
    photoUrl: inv.profile?.photoUrl,
    initials: inv.profile?.name.givenName?.charAt(0) || '?',
    status: 'pending',
  }));

  const allRows = [...enrolledRows, ...pendingRows];
  const hasPending = pendingRows.length > 0;

  // Obter lista unica de turmas
  const uniqueCourseIds = [...new Set(allRows.map((r) => r.courseId))];

  // Filtrar
  let filteredRows = allRows;

  if (filterCourse !== 'all') {
    filteredRows = filteredRows.filter((r) => r.courseId === filterCourse);
  }

  if (filterStatus !== 'all') {
    filteredRows = filteredRows.filter((r) => r.status === filterStatus);
  }

  if (filterSection !== 'all') {
    filteredRows = filteredRows.filter((r) => {
      const rowSections = getStudentSections(r.courseId, r.userId);
      if (filterSection === '__none__') return rowSections.length === 0;
      return rowSections.some(sec => sec.name === filterSection);
    });
  }

  if (search) {
    filteredRows = filteredRows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase())
    );
  }

  return (
    <Box>
      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        {/* Filtro por turma (apenas se multiplas turmas) */}
        {isMultiCourse && uniqueCourseIds.length > 1 && getCourseNameById && (
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

        {/* Filtro por status */}
        {hasPending && (
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="enrolled">Matriculados</MenuItem>
              <MenuItem value="pending">Convidados</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Filtro por secao */}
        {hasSections && allSectionNames.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filtrar por Secao</InputLabel>
            <Select
              value={filterSection}
              label="Filtrar por Secao"
              onChange={(e) => setFilterSection(e.target.value)}
            >
              <MenuItem value="all">Todas as Secoes</MenuItem>
              <MenuItem value="__none__">Sem secao</MenuItem>
              {allSectionNames.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Campo de busca */}
        <TextField
          size="small"
          placeholder="Buscar aluno por nome ou email..."
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={60}>#</TableCell>
              {isMultiCourse && <TableCell>Turma</TableCell>}
              <TableCell>Aluno</TableCell>
              <TableCell>Email</TableCell>
              <TableCell width={120}>Status</TableCell>
              {hasSections && <TableCell>Secao</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row, index) => {
              const courseName = getCourseNameById
                ? getCourseNameById(row.courseId)
                : '';
              const studentSections = hasSections ? getStudentSections(row.courseId, row.userId) : [];

              return (
                <TableRow key={row.key} hover sx={row.status === 'pending' ? { opacity: 0.75 } : undefined}>
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
                        src={row.photoUrl}
                        alt={row.fullName}
                        sx={{ width: 32, height: 32 }}
                      >
                        {row.initials}
                      </Avatar>
                      <Typography variant="body2">{row.fullName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {row.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {row.status === 'enrolled' ? (
                      <Chip
                        icon={<AcceptedIcon />}
                        label="Matriculado"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        icon={<PendingIcon />}
                        label="Convidado"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  {hasSections && (
                    <TableCell>
                      {studentSections.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {studentSections.map(section => (
                            <Chip
                              key={section.id}
                              label={section.name}
                              size="small"
                              sx={{
                                bgcolor: section.color,
                                color: '#fff',
                                fontWeight: 500,
                              }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}

            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={(isMultiCourse ? 5 : 4) + (hasSections ? 1 : 0)} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Nenhum aluno encontrado para &quot;{search}&quot;
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Total: {filteredRows.length} de {allRows.length} aluno(s)
        {pendingRows.length > 0 && ` (${enrolledRows.length} matriculados, ${pendingRows.length} convidados)`}
      </Typography>
    </Box>
  );
}
