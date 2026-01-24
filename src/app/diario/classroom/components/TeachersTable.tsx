/**
 * Tabela de professores do Google Classroom.
 * Suporta visualizacao de multiplas turmas com agrupamento.
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
} from '@mui/material';
import {
  Search as SearchIcon,
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import type { ClassroomTeacher } from '@/types/classroom';

interface TeachersTableProps {
  teachers: ClassroomTeacher[];
  isLoading: boolean;
  getCourseNameById?: (courseId: string) => string;
  isMultiCourse?: boolean;
}

export function TeachersTable({
  teachers,
  isLoading,
  getCourseNameById,
  isMultiCourse = false,
}: TeachersTableProps) {
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');

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

  if (teachers.length === 0) {
    return <Alert severity="info">Nenhum professor encontrado nas turmas selecionadas.</Alert>;
  }

  // Obter lista unica de turmas
  const uniqueCourseIds = [...new Set(teachers.map((t) => t.courseId))];

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
            const courseName = getCourseNameById ? getCourseNameById(courseId) : courseId;

            if (courseTeachers.length === 0 && search) return null;

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
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {courseTeachers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Nenhum professor encontrado para a busca.
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell width={60}>#</TableCell>
                            <TableCell>Professor</TableCell>
                            <TableCell>Email</TableCell>
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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
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
                </TableRow>
              </TableHead>
              <TableBody>
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
                    </TableRow>
                  );
                })}

                {filteredTeachers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isMultiCourse ? 4 : 3} align="center">
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
            Total: {filteredTeachers.length} de {teachers.length} professor(es)
          </Typography>
        </>
      )}
    </Box>
  );
}
