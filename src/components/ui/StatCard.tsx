'use client';

import { Box, Card, CardContent, Avatar, Typography, SxProps, Theme } from '@mui/material';
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
  iconBgColor = 'rgba(59, 130, 246, 0.1)',
  label,
  value,
  valueColor,
  sx,
}: StatCardProps) {
  return (
    <Card elevation={0} sx={{ height: '100%', ...sx }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            width: 56,
            height: 56,
            backgroundColor: iconBgColor,
            color: iconColor,
            '& .MuiSvgIcon-root': { fontSize: 28 },
          }}
        >
          {icon}
        </Avatar>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3, fontSize: '0.875rem' }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: valueColor || 'text.primary' }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
