'use client';

import { Box, Typography, Card } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Campaign } from '@mui/icons-material';

export function EmptyAnnouncements() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px dashed',
        borderColor: isDark ? alpha('#FFFFFF', 0.1) : '#E2E8F0',
        bgcolor: isDark ? alpha('#FFFFFF', 0.01) : '#FAFBFC',
        p: 5,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isDark ? alpha('#FFFFFF', 0.05) : '#F1F5F9',
          color: 'text.secondary',
          mx: 'auto',
          mb: 2,
        }}
      >
        <Campaign sx={{ fontSize: 24 }} />
      </Box>
      <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
        Nenhum comunicado
      </Typography>
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', maxWidth: 320, mx: 'auto', lineHeight: 1.5 }}>
        Comunicados de coordenadores e administradores aparecerao aqui.
      </Typography>
    </Card>
  );
}
