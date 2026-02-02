'use client';

import { Box, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';

interface PageBackgroundProps {
  children: ReactNode;
  variant?: 'green' | 'blue' | 'neutral';
  sx?: SxProps<Theme>;
}

const variantColors = {
  green: '#166534',
  blue: '#1E3A8A',
  neutral: 'background.default',
};

export default function PageBackground({ children, variant = 'green', sx }: PageBackgroundProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: variantColors[variant],
        py: 3,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
