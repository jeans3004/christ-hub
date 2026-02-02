/**
 * Logo Luminar para o header.
 * Usa fonte Orelega One com cor dourada para contraste.
 */

import { Typography, Box } from '@mui/material';

export function Logo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography
        component="span"
        sx={{
          fontFamily: '"Orelega One", serif',
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          fontWeight: 400,
          color: '#D97706', // Amber para contraste no header branco
          letterSpacing: '0.02em',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        Luminar
      </Typography>
    </Box>
  );
}
