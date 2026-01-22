/**
 * Filtros da pagina de horarios.
 */

import {
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Skeleton,
} from '@mui/material';
import { ViewList, Person } from '@mui/icons-material';
import { Turma, Usuario } from '@/types';
import { ViewMode } from '../hooks';

interface HorariosFiltersProps {
  ano: number;
  setAno: (ano: number) => void;
  turmaId: string;
  setTurmaId: (id: string) => void;
  professorId: string;
  setProfessorId: (id: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  turmas: Turma[];
  professores: Usuario[];
  loading: boolean;
}

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

export function HorariosFilters({
  ano,
  setAno,
  turmaId,
  setTurmaId,
  professorId,
  setProfessorId,
  viewMode,
  setViewMode,
  turmas,
  professores,
  loading,
}: HorariosFiltersProps) {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Linha 1: Ano e ViewMode */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Ano</InputLabel>
            <Select
              value={ano}
              label="Ano"
              onChange={(e) => setAno(Number(e.target.value))}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Visualizar por:
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="turma">
                <ViewList sx={{ mr: 0.5, fontSize: 18 }} />
                Turma
              </ToggleButton>
              <ToggleButton value="professor">
                <Person sx={{ mr: 0.5, fontSize: 18 }} />
                Professor
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Linha 2: Selecao de Turma ou Professor */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {viewMode === 'turma' ? (
            <FormControl size="small" sx={{ minWidth: 250, flex: 1, maxWidth: 400 }}>
              <InputLabel>Turma</InputLabel>
              {loading ? (
                <Skeleton variant="rectangular" height={40} />
              ) : (
                <Select
                  value={turmaId}
                  label="Turma"
                  onChange={(e) => setTurmaId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Selecione uma turma</em>
                  </MenuItem>
                  {turmas.map((turma) => (
                    <MenuItem key={turma.id} value={turma.id}>
                      {turma.nome}
                    </MenuItem>
                  ))}
                </Select>
              )}
            </FormControl>
          ) : (
            <FormControl size="small" sx={{ minWidth: 250, flex: 1, maxWidth: 400 }}>
              <InputLabel>Professor</InputLabel>
              {loading ? (
                <Skeleton variant="rectangular" height={40} />
              ) : (
                <Select
                  value={professorId}
                  label="Professor"
                  onChange={(e) => setProfessorId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Selecione um professor</em>
                  </MenuItem>
                  {professores.map((professor) => (
                    <MenuItem key={professor.id} value={professor.id}>
                      {professor.nome}
                    </MenuItem>
                  ))}
                </Select>
              )}
            </FormControl>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
