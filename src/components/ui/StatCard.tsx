'use client';

import { Box, Card, Typography, SxProps, Theme } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ReactElement } from 'react';

interface StatCardProps {
  icon: ReactElement;
  iconColor?: string;
  iconBgColor?: string;
  label: string;
  value: string | number;
  valueColor?: string;
  sx?: SxProps<Theme>;
}

export default function StatCard({
  icon,
  iconColor = '#3B82F6',
  label,
  value,
  valueColor,
  sx,
}: StatCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: isDark ? alpha('#FFFFFF', 0.02) : '#FFFFFF',
        transition: 'border-color 200ms ease',
        '&:hover': {
          borderColor: isDark ? alpha(iconColor, 0.3) : alpha(iconColor, 0.25),
        },
        ...sx,
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(iconColor, isDark ? 0.15 : 0.08),
            color: iconColor,
            mb: 2,
            '& .MuiSvgIcon-root': { fontSize: 20 },
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: valueColor || 'text.primary',
            letterSpacing: '-0.025em',
            lineHeight: 1,
            mb: 0.5,
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.8125rem',
          }}
        >
          {label}
        </Typography>
      </Box>
    </Card>
  );
}
