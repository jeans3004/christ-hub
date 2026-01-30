/**
 * Tab de grupos do WhatsApp.
 * Layout lado a lado: lista de grupos + composer de mensagem.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Alert,
  Button,
  Skeleton,
  Card,
  CardContent,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Search, Refresh, Group, Send, AdminPanelSettings, CheckCircle } from '@mui/icons-material';
import { GrupoWhatsApp } from '@/types';
import { useGrupos } from '../../hooks';
import { MediaData } from '../../types';
import { MensagemComposer } from '../MensagemComposer';

interface GruposTabProps {
  disabled?: boolean;
}

export function GruposTab({ disabled }: GruposTabProps) {
  const { grupos, loading, error, refreshGrupos, sendToGroup, sendMediaToGroup, sending } = useGrupos();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoWhatsApp | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [media, setMedia] = useState<MediaData | undefined>(undefined);
  const [sendError, setSendError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const filteredGrupos = grupos.filter((g) =>
    g.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectGrupo = useCallback((grupo: GrupoWhatsApp) => {
    setSelectedGrupo(grupo);
    setSendError(null);
    setSuccess(false);
  }, []);

  const handleSend = useCallback(async () => {
    if (!selectedGrupo) return;
    if (!mensagem.trim() && !media) return;

    setSendError(null);
    setSuccess(false);

    let result: { success: boolean; error?: string };

    if (media) {
      result = await sendMediaToGroup(selectedGrupo.id, media, mensagem.trim());
    } else {
      result = await sendToGroup(selectedGrupo.id, mensagem.trim());
    }

    if (result.success) {
      setSuccess(true);
      setMensagem('');
      setMedia(undefined);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setSendError(result.error || 'Erro ao enviar mensagem');
    }
  }, [selectedGrupo, mensagem, media, sendToGroup, sendMediaToGroup]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Skeleton variant="rounded" sx={{ flex: 1, minHeight: 300 }} />
        <Skeleton variant="rounded" sx={{ flex: 1, minHeight: 300 }} />
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Resultado do envio */}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Mensagem enviada com sucesso para o grupo!
        </Alert>
      )}
      {sendError && (
        <Alert severity="error" onClose={() => setSendError(null)}>
          {sendError}
        </Alert>
      )}

      {/* Grid: Grupos e Mensagem */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        {/* Selecao de grupo */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Selecione um grupo
              {selectedGrupo && (
                <Chip
                  label={selectedGrupo.nome}
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                  onDelete={() => setSelectedGrupo(null)}
                />
              )}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                placeholder="Buscar grupo..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={refreshGrupos}
                disabled={loading}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                <Refresh fontSize="small" />
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {filteredGrupos.length} grupo(s)
            </Typography>

            {filteredGrupos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Group sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                <Typography variant="body2">
                  {searchTerm ? 'Nenhum grupo encontrado' : 'Nenhum grupo disponivel'}
                </Typography>
              </Box>
            ) : (
              <List
                dense
                sx={{
                  maxHeight: 360,
                  overflow: 'auto',
                  mx: -2,
                }}
              >
                {filteredGrupos.map((grupo) => (
                  <ListItemButton
                    key={grupo.id}
                    selected={selectedGrupo?.id === grupo.id}
                    onClick={() => handleSelectGrupo(grupo)}
                    sx={{ borderRadius: 1, mx: 1 }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={grupo.profilePicUrl}
                        sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                      >
                        <Group fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight={selectedGrupo?.id === grupo.id ? 600 : 400} noWrap>
                            {grupo.nome}
                          </Typography>
                          {grupo.isAdmin && (
                            <AdminPanelSettings sx={{ fontSize: 14, color: 'primary.main' }} />
                          )}
                        </Box>
                      }
                      secondary={`${grupo.participantes} participantes`}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    {selectedGrupo?.id === grupo.id && (
                      <CheckCircle color="primary" fontSize="small" />
                    )}
                  </ListItemButton>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Composer */}
        <Card variant="outlined">
          <CardContent>
            <MensagemComposer
              value={mensagem}
              onChange={setMensagem}
              disabled={sending || !selectedGrupo || disabled}
              sending={sending}
              media={media}
              onMediaChange={setMedia}
              allowMedia={true}
              placeholder={
                selectedGrupo
                  ? `Mensagem para ${selectedGrupo.nome}...`
                  : 'Selecione um grupo para enviar...'
              }
            />
          </CardContent>
        </Card>
      </Box>

      {/* Botao de envio */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => {
            setMensagem('');
            setMedia(undefined);
            setSelectedGrupo(null);
            setSendError(null);
            setSuccess(false);
          }}
          disabled={sending || (!mensagem && !media && !selectedGrupo)}
        >
          Limpar
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <Send />}
          onClick={handleSend}
          disabled={
            sending ||
            disabled ||
            !selectedGrupo ||
            (!mensagem.trim() && !media)
          }
        >
          {sending
            ? 'Enviando...'
            : selectedGrupo
              ? `Enviar para ${selectedGrupo.nome}`
              : 'Enviar para Grupo'}
        </Button>
      </Box>
    </Box>
  );
}
