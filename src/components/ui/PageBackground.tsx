'use client';

import { Box, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';

interface PageBackgroundProps {
  children: ReactNode;
  variant?: 'green' | 'blue' | 'neutral';
  sx?: SxProps<Theme>;
}

export default function PageBackground({ children, variant = 'neutral', sx }: PageBackgroundProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 3,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
