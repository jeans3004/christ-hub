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
  showOnlyAno?: boolean;
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
  showOnlyAno = false,
}: HorariosFiltersProps) {
  // Modo simplificado: apenas ano
  if (showOnlyAno) {
    return (
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Ano letivo:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
          >
            {years.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
        {/* Linha 1: Ano e ViewMode */}
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 1, sm: 2 },
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: { xs: 'space-between', sm: 'flex-start' },
          }}
        >
          <FormControl size="small" sx={{ minWidth: { xs: 80, sm: 100 } }}>
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
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              Visualizar por:
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="turma">
                <ViewList sx={{ mr: { xs: 0, sm: 0.5 }, fontSize: 18 }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Turma
                </Box>
              </ToggleButton>
              <ToggleButton value="professor">
                <Person sx={{ mr: { xs: 0, sm: 0.5 }, fontSize: 18 }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Professor
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Linha 2: Selecao de Turma ou Professor */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {viewMode === 'turma' ? (
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 250 }, flex: 1, maxWidth: { sm: 400 } }}>
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
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 250 }, flex: 1, maxWidth: { sm: 400 } }}>
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
                  <MenuItem value="todos">
                    <strong>Todos os Professores</strong>
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
