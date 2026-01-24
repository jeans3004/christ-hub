/**
 * Modal de exportacao de dados do Google Classroom.
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
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  People as PeopleIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  courseName: string;
  onExportCourseWork: (formato: 'xlsx' | 'csv') => void;
  onExportGrades: (formato: 'xlsx' | 'csv') => void;
  onExportStudents: (formato: 'xlsx' | 'csv') => void;
}

type ExportType = 'atividades' | 'notas' | 'alunos';

export function ExportModal({
  open,
  onClose,
  courseName,
  onExportCourseWork,
  onExportGrades,
  onExportStudents,
}: ExportModalProps) {
  const [formato, setFormato] = useState<'xlsx' | 'csv'>('xlsx');
  const [selectedType, setSelectedType] = useState<ExportType | null>(null);

  const handleExport = () => {
    if (!selectedType) return;

    switch (selectedType) {
      case 'atividades':
        onExportCourseWork(formato);
        break;
      case 'notas':
        onExportGrades(formato);
        break;
      case 'alunos':
        onExportStudents(formato);
        break;
    }

    onClose();
    setSelectedType(null);
  };

  const exportOptions = [
    {
      type: 'atividades' as ExportType,
      icon: <AssignmentIcon />,
      title: 'Atividades',
      description: 'Exporta lista de atividades com titulo, tipo, prazo e pontuacao',
    },
    {
      type: 'notas' as ExportType,
      icon: <GradeIcon />,
      title: 'Notas',
      description: 'Exporta notas de todos os alunos em todas as atividades',
    },
    {
      type: 'alunos' as ExportType,
      icon: <PeopleIcon />,
      title: 'Lista de Alunos',
      description: 'Exporta lista de alunos com nome e email',
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Exportar Dados</DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Turma: <strong>{courseName}</strong>
        </Typography>

        {/* Selecao de formato */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Formato do Arquivo
          </Typography>
          <ToggleButtonGroup
            value={formato}
            exclusive
            onChange={(_, value) => value && setFormato(value)}
            size="small"
          >
            <ToggleButton value="xlsx">Excel (.xlsx)</ToggleButton>
            <ToggleButton value="csv">CSV (.csv)</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Selecao de tipo de exportacao */}
        <Typography variant="subtitle2" gutterBottom>
          O que deseja exportar?
        </Typography>

        <List disablePadding>
          {exportOptions.map((option) => (
            <ListItem key={option.type} disablePadding>
              <ListItemButton
                selected={selectedType === option.type}
                onClick={() => setSelectedType(option.type)}
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon>{option.icon}</ListItemIcon>
                <ListItemText primary={option.title} secondary={option.description} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={!selectedType}
        >
          Exportar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
