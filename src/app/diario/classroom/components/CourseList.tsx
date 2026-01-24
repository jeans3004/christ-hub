/**
 * Lista de turmas do Google Classroom.
 * Suporta selecao multipla de turmas.
 */

'use client';

import { Box, Grid, Typography, Skeleton, Alert, Checkbox, Chip, Paper } from '@mui/material';
import type { ClassroomCourse } from '@/types/classroom';
import { CourseCard } from './CourseCard';

interface CourseListProps {
  courses: ClassroomCourse[];
  selectedCourseIds: string[];
  isLoading: boolean;
  onToggle: (courseId: string) => void;
}

export function CourseList({ courses, selectedCourseIds, isLoading, onToggle }: CourseListProps) {
  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (courses.length === 0) {
    return (
      <Alert severity="info">
        Nenhuma turma ativa encontrada no Google Classroom. Verifique se voce esta conectado com a
        conta correta.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Clique para selecionar uma ou mais turmas. Voce pode selecionar varias para ver todas as atividades juntas.
        </Typography>
        {selectedCourseIds.length > 0 && (
          <Chip
            label={`${selectedCourseIds.length} turma(s) selecionada(s)`}
            color="primary"
            size="small"
          />
        )}
      </Box>

      <Grid container spacing={2}>
        {courses.map((course) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.id}>
            <CourseCard
              course={course}
              isSelected={selectedCourseIds.includes(course.id)}
              onSelect={onToggle}
              showCheckbox
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
