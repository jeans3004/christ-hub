/**
 * Logo do sistema.
 */

import { Box, Typography } from '@mui/material';

export function Logo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <svg width="32" height="32" viewBox="0 0 60 60" fill="none">
        <circle cx="18" cy="22" r="5" fill="currentColor" />
        <circle cx="42" cy="22" r="5" fill="currentColor" />
        <path
          d="M12 38 Q30 55 48 38"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <Typography
        variant="h6"
        component="span"
        sx={{
          fontWeight: 700,
          letterSpacing: '-0.02em',
          display: { xs: 'none', sm: 'block' },
        }}
      >
        diario
      </Typography>
    </Box>
  );
}
