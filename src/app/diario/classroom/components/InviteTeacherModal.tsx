/**
 * Modal para convidar professores para turmas do Google Classroom.
 * Permite convidar um professor para multiplas turmas de uma vez.
 */

'use client';

import { useState } from 'react';
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
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  School as SchoolIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import type { ClassroomCourse } from '@/types/classroom';

interface InviteTeacherModalProps {
  open: boolean;
  onClose: () => void;
  courses: ClassroomCourse[];
  onInvite: (email: string, courseIds: string[]) => Promise<{ courseId: string; success: boolean; error?: string }[]>;
}

export function InviteTeacherModal({
  open,
  onClose,
  courses,
  onInvite,
}: InviteTeacherModalProps) {
  const [email, setEmail] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [results, setResults] = useState<{ courseId: string; success: boolean; error?: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (isInviting) return;
    setEmail('');
    setSelectedCourseIds([]);
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

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      setError('Digite o email do professor');
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

    setIsInviting(true);
    setError(null);
    setResults(null);

    try {
      const inviteResults = await onInvite(email.trim(), selectedCourseIds);
      setResults(inviteResults);

      const successCount = inviteResults.filter((r) => r.success).length;
      if (successCount === inviteResults.length) {
        // Todos bem sucedidos - limpar formulario
        setEmail('');
        setSelectedCourseIds([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao convidar professor');
    } finally {
      setIsInviting(false);
    }
  };

  const getCourseNameById = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.name || courseId;
  };

  const successCount = results?.filter((r) => r.success).length || 0;
  const errorCount = results?.filter((r) => !r.success).length || 0;
  const allSelected = selectedCourseIds.length === courses.length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="primary" />
            <Typography variant="h6">Convidar Professor</Typography>
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

        {/* Resultados do convite */}
        {results && (
          <Alert
            severity={errorCount === 0 ? 'success' : successCount > 0 ? 'warning' : 'error'}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2" fontWeight={500}>
              {errorCount === 0
                ? `Professor convidado para ${successCount} turma(s) com sucesso!`
                : successCount > 0
                  ? `${successCount} convite(s) enviado(s), ${errorCount} erro(s)`
                  : 'Erro ao enviar convites'}
            </Typography>
            {errorCount > 0 && (
              <Box sx={{ mt: 1 }}>
                {results
                  .filter((r) => !r.success)
                  .map((r) => (
                    <Typography key={r.courseId} variant="caption" display="block" color="error">
                      {getCourseNameById(r.courseId)}: {r.error}
                    </Typography>
                  ))}
              </Box>
            )}
          </Alert>
        )}

        {/* Email do professor */}
        <TextField
          fullWidth
          label="Email do Professor"
          placeholder="professor@escola.edu.br"
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
          helperText="O professor recebera um convite por email"
        />

        <Divider sx={{ mb: 2 }} />

        {/* Selecao de turmas */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">
            Selecione as turmas ({selectedCourseIds.length} de {courses.length})
          </Typography>
          <Button size="small" onClick={handleSelectAll}>
            {allSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
          </Button>
        </Box>

        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
          <List dense disablePadding>
            {courses.map((course) => {
              const isSelected = selectedCourseIds.includes(course.id);
              const result = results?.find((r) => r.courseId === course.id);

              return (
                <ListItem
                  key={course.id}
                  disablePadding
                  secondaryAction={
                    result && (
                      result.success ? (
                        <SuccessIcon color="success" fontSize="small" />
                      ) : (
                        <ErrorIcon color="error" fontSize="small" />
                      )
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
                      primaryTypographyProps={{
                        fontWeight: isSelected ? 500 : 400,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Paper>

        {selectedCourseIds.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selectedCourseIds.map((id) => (
              <Chip
                key={id}
                label={getCourseNameById(id)}
                size="small"
                onDelete={() => handleToggleCourse(id)}
                disabled={isInviting}
              />
            ))}
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
