/**
 * Componente para selecao de grupos do WhatsApp.
 * Permite sincronizar grupos da Evolution API e selecionar para envio.
 */

'use client';

import { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { Refresh, People, CheckCircle, Groups, Info } from '@mui/icons-material';
import { GrupoWhatsApp } from '@/types';

interface GrupoSelectorProps {
  value: string | null;
  onChange: (grupoId: string | null) => void;
  grupos: GrupoWhatsApp[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function GrupoSelector({
  value,
  onChange,
  grupos,
  loading,
  onRefresh,
  disabled = false,
}: GrupoSelectorProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const grupoSelecionado = grupos.find((g) => g.id === value);

  return (
    <Box>
      {/* Seletor + Botao Sincronizar */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
        <FormControl fullWidth disabled={loading || disabled}>
          <InputLabel id="grupo-select-label">Grupo de Destino</InputLabel>
          <Select
            labelId="grupo-select-label"
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            label="Grupo de Destino"
            startAdornment={
              <InputAdornment position="start">
                <Groups sx={{ color: 'action.active' }} />
              </InputAdornment>
            }
          >
            <MenuItem value="">
              <em>Selecione um grupo</em>
            </MenuItem>
            {grupos.map((grupo) => (
              <MenuItem key={grupo.id} value={grupo.id}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body1" fontWeight={500}>
                    {grupo.nome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {grupo.participantes} participantes
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="Buscar grupos do WhatsApp">
          <Button
            variant="outlined"
            onClick={handleRefresh}
            disabled={refreshing || loading || disabled}
            sx={{ minWidth: 130, height: 56 }}
          >
            {refreshing ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <Refresh sx={{ mr: 0.5 }} />
                Sincronizar
              </>
            )}
          </Button>
        </Tooltip>
      </Box>

      {/* Grupo Selecionado */}
      {grupoSelecionado && (
        <Alert severity="info" icon={<CheckCircle />} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2">Mensagem sera enviada para:</Typography>
            <Chip
              icon={<People />}
              label={`${grupoSelecionado.nome} (${grupoSelecionado.participantes} pessoas)`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Alert>
      )}

      {/* Estado Vazio */}
      {grupos.length === 0 && !loading && (
        <Alert
          severity="warning"
          icon={<Info />}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh} disabled={refreshing}>
              Sincronizar
            </Button>
          }
        >
          Nenhum grupo encontrado. Clique em &quot;Sincronizar&quot; para buscar grupos do WhatsApp.
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Carregando grupos...
          </Typography>
        </Box>
      )}
    </Box>
  );
}
