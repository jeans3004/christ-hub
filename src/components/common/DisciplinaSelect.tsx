'use client';

/**
 * Select de disciplinas padronizado para uso em todo o sistema.
 * Filtra automaticamente grupos (isGroup = true) e agrupa por disciplina pai.
 */

import { useMemo } from 'react';
import { Autocomplete, TextField, Box, Typography, Chip } from '@mui/material';
import { MenuBook, Folder } from '@mui/icons-material';
import { Disciplina } from '@/types';

interface DisciplinaSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disciplinas: Disciplina[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  filterByTurma?: string;
  showGroups?: boolean;
  size?: 'small' | 'medium';
}

interface DisciplinaOption extends Disciplina {
  groupName: string | null;
}

export function DisciplinaSelect({
  value,
  onChange,
  disciplinas,
  label = 'Disciplina',
  placeholder = 'Selecione uma disciplina',
  required = false,
  error = false,
  helperText,
  disabled = false,
  filterByTurma,
  showGroups = true,
  size = 'medium',
}: DisciplinaSelectProps) {
  // Filtra disciplinas selecionaveis e cria opcoes com grupo
  const options = useMemo((): DisciplinaOption[] => {
    let filtered = disciplinas.filter(d => d.isGroup !== true && d.ativo);

    // Filtra por turma se especificado
    if (filterByTurma) {
      filtered = filtered.filter(d => d.turmaIds?.includes(filterByTurma));
    }

    // Mapeia para incluir nome do grupo pai
    return filtered.map(d => {
      const parent = d.parentId ? disciplinas.find(p => p.id === d.parentId) : null;
      return {
        ...d,
        groupName: parent?.nome || null,
      };
    }).sort((a, b) => {
      // Ordena por grupo primeiro, depois por nome
      if (a.groupName && !b.groupName) return 1;
      if (!a.groupName && b.groupName) return -1;
      if (a.groupName !== b.groupName) {
        return (a.groupName || '').localeCompare(b.groupName || '');
      }
      return a.nome.localeCompare(b.nome);
    });
  }, [disciplinas, filterByTurma]);

  // Encontra a opcao selecionada
  const selectedOption = useMemo(() => {
    return options.find(o => o.id === value) || null;
  }, [options, value]);

  return (
    <Autocomplete
      value={selectedOption}
      onChange={(_, newValue) => onChange(newValue?.id || null)}
      options={options}
      getOptionLabel={(option) => option.nome}
      groupBy={showGroups ? (option) => option.groupName || 'Sem grupo' : undefined}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      disabled={disabled}
      size={size}
      renderOption={(props, option) => {
        const { key, ...restProps } = props;
        return (
          <li key={key} {...restProps}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MenuBook fontSize="small" color="primary" />
              <Box>
                <Typography variant="body2">{option.nome}</Typography>
                {option.codigo && (
                  <Typography variant="caption" color="text.secondary">
                    {option.codigo}
                  </Typography>
                )}
              </Box>
            </Box>
          </li>
        );
      }}
      renderGroup={showGroups ? (params) => (
        <li key={params.key}>
          <Box
            sx={{
              position: 'sticky',
              top: -8,
              px: 2,
              py: 1,
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Folder fontSize="small" color="action" />
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              {params.group}
            </Typography>
          </Box>
          <ul style={{ padding: 0 }}>{params.children}</ul>
        </li>
      ) : undefined}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
        />
      )}
      noOptionsText="Nenhuma disciplina disponivel"
    />
  );
}

// Versao para selecao multipla
interface DisciplinaMultiSelectProps extends Omit<DisciplinaSelectProps, 'value' | 'onChange'> {
  value: string[];
  onChange: (value: string[]) => void;
}

export function DisciplinaMultiSelect({
  value,
  onChange,
  disciplinas,
  label = 'Disciplinas',
  placeholder = 'Selecione disciplinas',
  required = false,
  error = false,
  helperText,
  disabled = false,
  filterByTurma,
  showGroups = true,
  size = 'medium',
}: DisciplinaMultiSelectProps) {
  const options = useMemo((): DisciplinaOption[] => {
    let filtered = disciplinas.filter(d => d.isGroup !== true && d.ativo);

    if (filterByTurma) {
      filtered = filtered.filter(d => d.turmaIds?.includes(filterByTurma));
    }

    return filtered.map(d => {
      const parent = d.parentId ? disciplinas.find(p => p.id === d.parentId) : null;
      return {
        ...d,
        groupName: parent?.nome || null,
      };
    }).sort((a, b) => {
      if (a.groupName && !b.groupName) return 1;
      if (!a.groupName && b.groupName) return -1;
      if (a.groupName !== b.groupName) {
        return (a.groupName || '').localeCompare(b.groupName || '');
      }
      return a.nome.localeCompare(b.nome);
    });
  }, [disciplinas, filterByTurma]);

  const selectedOptions = useMemo(() => {
    return options.filter(o => value.includes(o.id));
  }, [options, value]);

  return (
    <Autocomplete
      multiple
      value={selectedOptions}
      onChange={(_, newValue) => onChange(newValue.map(v => v.id))}
      options={options}
      getOptionLabel={(option) => option.nome}
      groupBy={showGroups ? (option) => option.groupName || 'Sem grupo' : undefined}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      disabled={disabled}
      size={size}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const { key, ...restProps } = getTagProps({ index });
          return (
            <Chip
              key={key}
              {...restProps}
              label={option.nome}
              size="small"
              icon={<MenuBook fontSize="small" />}
            />
          );
        })
      }
      renderOption={(props, option) => {
        const { key, ...restProps } = props;
        return (
          <li key={key} {...restProps}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MenuBook fontSize="small" color="primary" />
              <Typography variant="body2">{option.nome}</Typography>
            </Box>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={selectedOptions.length === 0 ? placeholder : ''}
          required={required}
          error={error}
          helperText={helperText}
        />
      )}
      noOptionsText="Nenhuma disciplina disponivel"
    />
  );
}
