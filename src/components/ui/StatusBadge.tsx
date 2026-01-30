'use client';

import { Box, Typography, SxProps, Theme } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ReactElement } from 'react';

type Variant = 'success' | 'error' | 'warning' | 'info';

interface StatusBadgeProps {
  variant: Variant;
  label: string;
  icon?: ReactElement;
  size?: 'sm' | 'md';
  sx?: SxProps<Theme>;
}

export default function StatusBadge({ variant, label, icon, size = 'md', sx }: StatusBadgeProps) {
  const theme = useTheme();
  const paletteColor = theme.palette[variant];

  const isSmall = size === 'sm';

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: isSmall ? 1 : 1.5,
        py: isSmall ? 0.25 : 0.5,
        borderRadius: 1,
        backgroundColor: alpha(paletteColor.main, theme.palette.mode === 'dark' ? 0.15 : 0.1),
        border: `1px solid ${alpha(paletteColor.main, theme.palette.mode === 'dark' ? 0.4 : 0.3)}`,
        ...sx,
      }}
    >
      {icon && (
        <Box
          sx={{
            display: 'flex',
            color: paletteColor.main,
            '& .MuiSvgIcon-root': { fontSize: isSmall ? 14 : 16 },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography
        sx={{
          fontSize: isSmall ? '0.6875rem' : '0.75rem',
          fontWeight: 600,
          color: paletteColor.main,
          lineHeight: 1.4,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
