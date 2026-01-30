'use client';

import { Box, SxProps, Theme } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ReactElement } from 'react';

interface IconCircleProps {
  icon: ReactElement;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  sx?: SxProps<Theme>;
}

const sizeMap = {
  sm: { box: 32, icon: 18 },
  md: { box: 40, icon: 22 },
  lg: { box: 52, icon: 28 },
};

export default function IconCircle({ icon, color, size = 'md', sx }: IconCircleProps) {
  const theme = useTheme();
  const resolved = color || theme.palette.primary.main;
  const dims = sizeMap[size];

  return (
    <Box
      sx={{
        width: dims.box,
        height: dims.box,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: alpha(resolved, 0.12),
        color: resolved,
        flexShrink: 0,
        '& .MuiSvgIcon-root': { fontSize: dims.icon },
        ...sx,
      }}
    >
      {icon}
    </Box>
  );
}
