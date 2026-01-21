/**
 * Inputs para preencher variáveis de template.
 */

'use client';
import { Box, TextField, Typography, Chip, Collapse, IconButton, Tooltip, Alert } from '@mui/material';
import { ExpandMore, ExpandLess, Info } from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { VariavelTemplate, VARIAVEIS_SISTEMA } from '../../types';

interface VariableInputsProps {
  variables: VariavelTemplate[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
  showSystemVariables?: boolean;
  compact?: boolean;
}

export function VariableInputs({
  variables,
  values,
  onChange,
  disabled = false,
  showSystemVariables = false,
  compact = false,
}: VariableInputsProps) {
  const [expanded, setExpanded] = useState(true);

  // Separa variáveis manuais das do sistema
  const { manualVariables, systemVariables } = useMemo(() => {
    const systemKeys = VARIAVEIS_SISTEMA.map((v) => v.chave);
    const manual = variables.filter((v) => !systemKeys.includes(v.chave));
    const system = variables.filter((v) => systemKeys.includes(v.chave));
    return { manualVariables: manual, systemVariables: system };
  }, [variables]);

  // Verifica se há variáveis obrigatórias não preenchidas
  const missingRequired = useMemo(() => {
    return manualVariables.filter(
      (v) => v.obrigatoria && !values[v.chave]?.trim()
    );
  }, [manualVariables, values]);

  if (manualVariables.length === 0 && (!showSystemVariables || systemVariables.length === 0)) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Variáveis do Template
          </Typography>
          <Chip
            label={`${manualVariables.length} campo${manualVariables.length !== 1 ? 's' : ''}`}
            size="small"
            variant="outlined"
          />
          {missingRequired.length > 0 && (
            <Chip
              label={`${missingRequired.length} obrigatório${missingRequired.length !== 1 ? 's' : ''}`}
              size="small"
              color="warning"
            />
          )}
        </Box>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        {missingRequired.length > 0 && (
          <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
            Preencha os campos obrigatórios para enviar a mensagem
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 2,
          }}
        >
          {manualVariables.map((variable) => (
            <TextField
              key={variable.chave}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{`{{${variable.chave}}}`}</span>
                  {variable.obrigatoria && (
                    <Typography component="span" color="error">
                      *
                    </Typography>
                  )}
                </Box>
              }
              placeholder={variable.descricao}
              value={values[variable.chave] || ''}
              onChange={(e) => onChange(variable.chave, e.target.value)}
              disabled={disabled}
              required={variable.obrigatoria}
              error={variable.obrigatoria && !values[variable.chave]?.trim()}
              size="small"
              fullWidth
              helperText={variable.descricao}
              InputProps={{
                endAdornment: variable.valorPadrao && !values[variable.chave] && (
                  <Tooltip title={`Valor padrão: ${variable.valorPadrao}`}>
                    <IconButton
                      size="small"
                      onClick={() => onChange(variable.chave, variable.valorPadrao || '')}
                    >
                      <Info fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
          ))}
        </Box>

        {/* Variáveis do sistema (apenas informativo) */}
        {showSystemVariables && systemVariables.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Variáveis preenchidas automaticamente:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {systemVariables.map((v) => (
                <Tooltip key={v.chave} title={v.descricao}>
                  <Chip
                    label={`{{${v.chave}}}`}
                    size="small"
                    variant="outlined"
                    color="info"
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        )}
      </Collapse>
    </Box>
  );
}
