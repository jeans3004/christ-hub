/**
 * Card de exibicao de grupo do WhatsApp.
 */

'use client';

import { Card, CardContent, CardActions, Typography, Avatar, Button, Box, Chip } from '@mui/material';
import { Group, Send, AdminPanelSettings } from '@mui/icons-material';
import { GrupoWhatsApp } from '@/types';

interface GrupoCardProps {
  grupo: GrupoWhatsApp;
  onSendMessage: (grupo: GrupoWhatsApp) => void;
  disabled?: boolean;
}

export function GrupoCard({ grupo, onSendMessage, disabled }: GrupoCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Avatar
            src={grupo.profilePicUrl}
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.main',
            }}
          >
            <Group />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              noWrap
              title={grupo.nome}
            >
              {grupo.nome}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {grupo.participantes} participantes
            </Typography>
          </Box>
        </Box>

        {grupo.descricao && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 1,
            }}
          >
            {grupo.descricao}
          </Typography>
        )}

        {grupo.isAdmin && (
          <Chip
            icon={<AdminPanelSettings fontSize="small" />}
            label="Admin"
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<Send />}
          onClick={() => onSendMessage(grupo)}
          disabled={disabled}
          fullWidth
        >
          Enviar Mensagem
        </Button>
      </CardActions>
    </Card>
  );
}
