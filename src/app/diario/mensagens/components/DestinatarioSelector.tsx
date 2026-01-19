'use client';

/**
 * Seletor de destinatarios para envio de mensagens.
 * Lista professores com celular cadastrado.
 */

import { useMemo } from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { Person, Phone } from '@mui/icons-material';
import { CheckboxSelector, CheckboxOption } from '@/components/common/CheckboxSelector';
import { Destinatario, formatPhoneDisplay } from '../types';

interface DestinatarioSelectorProps {
  destinatarios: Destinatario[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function DestinatarioSelector({
  destinatarios,
  selected,
  onChange,
  disabled = false,
  loading = false,
}: DestinatarioSelectorProps) {
  // Converter destinatarios em opcoes
  const options: CheckboxOption<Destinatario>[] = useMemo(() => {
    return destinatarios.map((d) => ({
      id: d.id,
      label: d.nome,
      description: formatPhoneDisplay(d.numero),
      icon: <Person fontSize="small" />,
      data: d,
    }));
  }, [destinatarios]);

  // Destinatarios selecionados
  const selectedDestinatarios = useMemo(() => {
    return destinatarios.filter((d) => selected.includes(d.id));
  }, [destinatarios, selected]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Destinatarios
        </Typography>
        {selected.length > 0 && (
          <Chip
            label={`${selected.length} selecionado${selected.length !== 1 ? 's' : ''}`}
            size="small"
            color="primary"
          />
        )}
      </Box>

      <CheckboxSelector
        options={options}
        selected={selected}
        onChange={onChange}
        columns={2}
        maxHeight={300}
        loading={loading}
        disabled={disabled}
        searchPlaceholder="Buscar professor..."
        showSelectAll
        showCounter
        size="small"
        helperText={destinatarios.length === 0 ? 'Nenhum professor com celular cadastrado' : undefined}
      />

      {/* Preview dos selecionados */}
      {selectedDestinatarios.length > 0 && selectedDestinatarios.length <= 5 && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Enviando para:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {selectedDestinatarios.map((d) => (
              <Chip
                key={d.id}
                icon={<Phone sx={{ fontSize: 14 }} />}
                label={`${d.nome.split(' ')[0]} - ${formatPhoneDisplay(d.numero)}`}
                size="small"
                variant="outlined"
                onDelete={() => onChange(selected.filter((id) => id !== d.id))}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
