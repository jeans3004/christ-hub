/**
 * Logo Luminar para o header.
 */

import { Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export function Logo() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography
        component="span"
        sx={{
          fontFamily: '"Orelega One", serif',
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
          fontWeight: 400,
          color: isDark ? '#F0F6FC' : '#111827',
          letterSpacing: '-0.01em',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        Luminar
      </Typography>
    </Box>
  );
}
