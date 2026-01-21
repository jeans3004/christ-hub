/**
 * Tab de grupos do WhatsApp.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Alert,
  Button,
  Skeleton,
} from '@mui/material';
import { Search, Refresh, Group } from '@mui/icons-material';
import { GrupoWhatsApp } from '@/types';
import { useGrupos } from '../../hooks';
import { GrupoCard } from './GrupoCard';
import { GrupoSendModal } from './GrupoSendModal';

interface GruposTabProps {
  disabled?: boolean;
}

export function GruposTab({ disabled }: GruposTabProps) {
  const { grupos, loading, error, refreshGrupos } = useGrupos();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoWhatsApp | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredGrupos = grupos.filter((g) =>
    g.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = useCallback((grupo: GrupoWhatsApp) => {
    setSelectedGrupo(grupo);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedGrupo(null);
  }, []);

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Skeleton variant="rounded" width="100%" height={56} />
          <Skeleton variant="rounded" width={120} height={56} />
        </Box>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={180} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={refreshGrupos}>
            Tentar Novamente
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header com busca */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar grupo..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={refreshGrupos}
          disabled={loading}
        >
          Atualizar
        </Button>
      </Box>

      {/* Contador */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredGrupos.length} grupo(s) encontrado(s)
      </Typography>

      {/* Grid de grupos */}
      {filteredGrupos.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary',
          }}
        >
          <Group sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6">
            {searchTerm ? 'Nenhum grupo encontrado' : 'Nenhum grupo disponivel'}
          </Typography>
          <Typography variant="body2" sx={{ maxWidth: 400, mx: 'auto' }}>
            {searchTerm
              ? 'Tente buscar por outro termo'
              : 'Se voce participa de grupos, envie uma mensagem em algum grupo pelo celular para sincronizar, ou verifique a configuracao da Evolution API.'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredGrupos.map((grupo) => (
            <Grid key={grupo.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <GrupoCard
                grupo={grupo}
                onSendMessage={handleSendMessage}
                disabled={disabled}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal de envio */}
      <GrupoSendModal
        open={modalOpen}
        onClose={handleCloseModal}
        grupo={selectedGrupo}
      />
    </Box>
  );
}
