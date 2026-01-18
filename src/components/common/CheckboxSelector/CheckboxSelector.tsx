'use client';

/**
 * Componente de selecao multipla com checkboxes em grid.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Search, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { CheckboxSelectorProps, CheckboxOption } from './types';
import { CheckboxSelectorItem } from './CheckboxSelectorItem';

export function CheckboxSelector<T = unknown>({
  options,
  selected,
  onChange,
  columns = 2,
  maxHeight = 280,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  showSelectAll = true,
  showCounter = true,
  groupBy = false,
  loading = false,
  error,
  disabled = false,
  size = 'medium',
  minSelection,
  maxSelection,
  helperText,
}: CheckboxSelectorProps<T>) {
  const [search, setSearch] = useState('');

  // Filtrar opcoes pela busca
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.description?.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  // Agrupar opcoes se necessario
  const groupedOptions = useMemo(() => {
    if (!groupBy) return { '': filteredOptions };

    return filteredOptions.reduce((acc, opt) => {
      const group = opt.group || 'Outros';
      if (!acc[group]) acc[group] = [];
      acc[group].push(opt);
      return acc;
    }, {} as Record<string, CheckboxOption<T>[]>);
  }, [filteredOptions, groupBy]);

  // Handlers
  const handleItemChange = useCallback(
    (id: string, checked: boolean) => {
      if (disabled) return;

      if (checked) {
        if (maxSelection && selected.length >= maxSelection) return;
        onChange([...selected, id]);
      } else {
        onChange(selected.filter((s) => s !== id));
      }
    },
    [selected, onChange, disabled, maxSelection]
  );

  const handleSelectAll = useCallback(() => {
    if (disabled) return;
    const visibleIds = filteredOptions.filter((o) => !o.disabled).map((o) => o.id);

    if (maxSelection) {
      const remaining = maxSelection - selected.length;
      const toAdd = visibleIds.filter((id) => !selected.includes(id)).slice(0, remaining);
      onChange([...selected, ...toAdd]);
    } else {
      const newSelected = new Set([...selected, ...visibleIds]);
      onChange(Array.from(newSelected));
    }
  }, [filteredOptions, selected, onChange, disabled, maxSelection]);

  const handleClearAll = useCallback(() => {
    if (disabled) return;
    const visibleIds = new Set(filteredOptions.map((o) => o.id));
    onChange(selected.filter((s) => !visibleIds.has(s)));
  }, [filteredOptions, selected, onChange, disabled]);

  // Contadores
  const visibleSelectedCount = filteredOptions.filter((o) => selected.includes(o.id)).length;
  const allVisibleSelected =
    visibleSelectedCount === filteredOptions.filter((o) => !o.disabled).length &&
    filteredOptions.length > 0;

  // Validacao
  const hasMinError = minSelection !== undefined && selected.length < minSelection;

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 1 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: hasMinError ? 'error.main' : 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {/* Header com busca e acoes */}
      {(searchable || showSelectAll) && (
        <Box
          sx={{
            p: 1.5,
            bgcolor: 'grey.50',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {searchable && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={disabled}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 150 }}
            />
          )}

          {showSelectAll && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button
                size="small"
                onClick={handleSelectAll}
                disabled={disabled || allVisibleSelected}
                startIcon={<CheckBox fontSize="small" />}
                sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
              >
                Todos
              </Button>
              <Button
                size="small"
                onClick={handleClearAll}
                disabled={disabled || visibleSelectedCount === 0}
                startIcon={<CheckBoxOutlineBlank fontSize="small" />}
                sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
              >
                Limpar
              </Button>
            </Box>
          )}
        </Box>
      )}

      {(searchable || showSelectAll) && <Divider />}

      {/* Grid de opcoes */}
      <Box
        sx={{
          p: 1.5,
          maxHeight,
          overflowY: 'auto',
        }}
      >
        {filteredOptions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
            {search ? 'Nenhum resultado encontrado' : 'Nenhuma opcao disponivel'}
          </Typography>
        ) : groupBy ? (
          Object.entries(groupedOptions).map(([group, opts]) => (
            <Box key={group} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
              {group && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}
                >
                  {group}
                </Typography>
              )}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: 1,
                }}
              >
                {opts.map((option) => (
                  <CheckboxSelectorItem
                    key={option.id}
                    option={option}
                    checked={selected.includes(option.id)}
                    onChange={handleItemChange}
                    disabled={disabled || (maxSelection !== undefined && selected.length >= maxSelection && !selected.includes(option.id))}
                    size={size}
                  />
                ))}
              </Box>
            </Box>
          ))
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: 1,
            }}
          >
            {filteredOptions.map((option) => (
              <CheckboxSelectorItem
                key={option.id}
                option={option}
                checked={selected.includes(option.id)}
                onChange={handleItemChange}
                disabled={disabled || (maxSelection !== undefined && selected.length >= maxSelection && !selected.includes(option.id))}
                size={size}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Footer com contador */}
      {(showCounter || helperText) && (
        <>
          <Divider />
          <Box
            sx={{
              p: 1,
              bgcolor: 'grey.50',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {showCounter && (
              <Typography variant="caption" color="text.secondary">
                {selected.length} de {options.length} selecionado{selected.length !== 1 ? 's' : ''}
                {maxSelection && ` (max: ${maxSelection})`}
              </Typography>
            )}
            {helperText && (
              <Typography
                variant="caption"
                color={hasMinError ? 'error.main' : 'text.secondary'}
              >
                {helperText}
              </Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
