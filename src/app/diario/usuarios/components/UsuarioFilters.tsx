'use client';

/**
 * Componente de filtros para listagem de usuários.
 */

import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Stack,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { UsuarioFilters as FiltersType, TIPO_OPTIONS, STATUS_LABELS } from '../types';

interface UsuarioFiltersProps {
  filters: FiltersType;
  onChange: (filters: FiltersType) => void;
  stats: {
    total: number;
    ativos: number;
    inativos: number;
    pendentes: number;
    porTipo: {
      professor: number;
      coordenador: number;
      administrador: number;
    };
  };
}

export default function UsuarioFilters({ filters, onChange, stats }: UsuarioFiltersProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Stats chips */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Chip
          label={`Total: ${stats.total}`}
          size="small"
          variant={filters.status === 'todos' ? 'filled' : 'outlined'}
          onClick={() => onChange({ ...filters, status: 'todos' })}
        />
        <Chip
          label={`Ativos: ${stats.ativos}`}
          size="small"
          color="success"
          variant={filters.status === 'ativos' ? 'filled' : 'outlined'}
          onClick={() => onChange({ ...filters, status: 'ativos' })}
        />
        <Chip
          label={`Inativos: ${stats.inativos}`}
          size="small"
          color="default"
          variant={filters.status === 'inativos' ? 'filled' : 'outlined'}
          onClick={() => onChange({ ...filters, status: 'inativos' })}
        />
        <Chip
          label={`Pendentes: ${stats.pendentes}`}
          size="small"
          color="warning"
          variant={filters.status === 'pendentes' ? 'filled' : 'outlined'}
          onClick={() => onChange({ ...filters, status: 'pendentes' })}
        />
      </Stack>

      {/* Filtros */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar por nome, e-mail ou CPF..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          sx={{ flex: 1, minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            value={filters.tipo}
            label="Tipo"
            onChange={(e) => onChange({ ...filters, tipo: e.target.value as FiltersType['tipo'] })}
          >
            {TIPO_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
                {opt.value !== 'todos' && (
                  <Chip
                    size="small"
                    label={stats.porTipo[opt.value]}
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}
