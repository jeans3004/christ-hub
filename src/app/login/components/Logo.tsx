'use client';

/**
 * Logo do sistema Diario.
 */

import { Box, Typography } from '@mui/material';

export function Logo() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        {/* Eyes */}
        <circle cx="18" cy="22" r="5" fill="#7C3AED" />
        <circle cx="42" cy="22" r="5" fill="#7C3AED" />
        {/* Smile */}
        <path
          d="M12 38 Q30 55 48 38"
          stroke="#7C3AED"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <Typography
        variant="h5"
        sx={{
          mt: 2,
          fontWeight: 700,
          color: 'primary.main',
          letterSpacing: '-0.02em',
        }}
      >
        diario
      </Typography>
    </Box>
  );
}
