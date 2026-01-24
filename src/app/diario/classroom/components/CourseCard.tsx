/**
 * Card de turma do Google Classroom.
 * Suporta selecao multipla com checkbox.
 */

'use client';

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Checkbox,
} from '@mui/material';
import {
  School as SchoolIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircle as SelectedIcon,
} from '@mui/icons-material';
import type { ClassroomCourse } from '@/types/classroom';

interface CourseCardProps {
  course: ClassroomCourse;
  isSelected: boolean;
  onSelect: (courseId: string) => void;
  showCheckbox?: boolean;
}

export function CourseCard({ course, isSelected, onSelect, showCheckbox = false }: CourseCardProps) {
  const handleOpenInClassroom = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(course.alternateLink, '_blank');
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        bgcolor: isSelected ? 'primary.50' : 'background.paper',
        '&:hover': {
          boxShadow: 4,
          borderColor: 'primary.light',
        },
      }}
      onClick={() => onSelect(course.id)}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          {showCheckbox && (
            <Checkbox
              checked={isSelected}
              size="small"
              sx={{ p: 0, mr: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onSelect(course.id)}
            />
          )}
          <SchoolIcon color={isSelected ? 'primary' : 'action'} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap title={course.name}>
              {course.name}
            </Typography>
            {course.section && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {course.section}
              </Typography>
            )}
          </Box>
          {isSelected && !showCheckbox && <SelectedIcon color="primary" />}
        </Box>

        {course.descriptionHeading && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} noWrap>
            {course.descriptionHeading}
          </Typography>
        )}

        {course.room && (
          <Chip label={`Sala: ${course.room}`} size="small" variant="outlined" sx={{ mt: 1 }} />
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          variant={isSelected ? 'contained' : 'outlined'}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(course.id);
          }}
        >
          {isSelected ? 'Selecionada' : 'Selecionar'}
        </Button>

        <Tooltip title="Abrir no Classroom">
          <IconButton size="small" onClick={handleOpenInClassroom}>
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
