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
import { Search as SearchIcon, School as SchoolIcon } from '@mui/icons-material';
import { classroomSectionService } from '@/services/firestore';
import type { ClassroomStudent, CourseSection } from '@/types/classroom';

interface StudentsTableProps {
  students: ClassroomStudent[];
  isLoading: boolean;
  getCourseNameById?: (courseId: string) => string;
  isMultiCourse?: boolean;
}

export function StudentsTable({
  students,
  isLoading,
  getCourseNameById,
  isMultiCourse = false,
}: StudentsTableProps) {
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
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
  }, [students]);

  const hasSections = Object.keys(sectionsMap).length > 0;

  const getStudentSection = (student: ClassroomStudent): CourseSection | null => {
    const sections = sectionsMap[student.courseId];
    if (!sections) return null;
    return sections.find(s => s.studentIds.includes(student.userId)) || null;
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

  if (students.length === 0) {
    return <Alert severity="info">Nenhum aluno matriculado nas turmas selecionadas.</Alert>;
  }

  // Obter lista unica de turmas
  const uniqueCourseIds = [...new Set(students.map((s) => s.courseId))];

  // Filtrar por turma e busca
  let filteredStudents = students;

  if (filterCourse !== 'all') {
    filteredStudents = filteredStudents.filter((s) => s.courseId === filterCourse);
  }

  if (filterSection !== 'all') {
    filteredStudents = filteredStudents.filter((s) => {
      const section = getStudentSection(s);
      if (filterSection === '__none__') return !section;
      return section?.name === filterSection;
    });
  }

  if (search) {
    filteredStudents = filteredStudents.filter(
      (s) =>
        s.profile.name.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.profile.emailAddress.toLowerCase().includes(search.toLowerCase())
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
              {hasSections && <TableCell>Secao</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student, index) => {
              const courseName = getCourseNameById
                ? getCourseNameById(student.courseId)
                : '';
              const section = hasSections ? getStudentSection(student) : null;

              return (
                <TableRow key={`${student.courseId}-${student.userId}`} hover>
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
                        src={student.profile.photoUrl}
                        alt={student.profile.name.fullName}
                        sx={{ width: 32, height: 32 }}
                      >
                        {student.profile.name.givenName?.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{student.profile.name.fullName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {student.profile.emailAddress}
                    </Typography>
                  </TableCell>
                  {hasSections && (
                    <TableCell>
                      {section ? (
                        <Chip
                          label={section.name}
                          size="small"
                          sx={{
                            bgcolor: section.color,
                            color: '#fff',
                            fontWeight: 500,
                          }}
                        />
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

            {filteredStudents.length === 0 && (
              <TableRow>
                <TableCell colSpan={(isMultiCourse ? 4 : 3) + (hasSections ? 1 : 0)} align="center">
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
        Total: {filteredStudents.length} de {students.length} aluno(s)
      </Typography>
    </Box>
  );
}
