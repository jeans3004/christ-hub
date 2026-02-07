'use client';

import { Box, Typography, Card, SxProps, Theme } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { WavingHand } from '@mui/icons-material';
import { ReactNode } from 'react';
import LiveClock from './LiveClock';
import IconCircle from './IconCircle';

interface StatusItem {
  icon: ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

interface HeroCardProps {
  userName: string;
  userRole?: string;
  greeting?: string;
  statusItems?: StatusItem[];
  children?: ReactNode;
  sx?: SxProps<Theme>;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HeroCard({
  userName,
  userRole,
  greeting,
  statusItems,
  children,
  sx,
}: HeroCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const displayGreeting = greeting ?? getGreeting();

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: isDark ? alpha('#3B82F6', 0.08) : '#F8FAFC',
        border: '1px solid',
        borderColor: isDark ? alpha('#3B82F6', 0.15) : '#E2E8F0',
        p: { xs: 2.5, sm: 3.5 },
        '&:hover': { boxShadow: 'none', borderColor: isDark ? alpha('#3B82F6', 0.15) : '#E2E8F0' },
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              {displayGreeting}
            </Typography>
            <WavingHand sx={{ fontSize: 18, color: '#F59E0B' }} />
          </Box>
          <Typography
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.875rem' },
              fontWeight: 700,
              color: 'text.primary',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              mb: 0.5,
            }}
          >
            {userName}
          </Typography>
          {userRole && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 400,
              }}
            >
              {userRole}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <LiveClock showDate sx={{ color: 'text.primary' }} />
        </Box>
      </Box>

      {statusItems && statusItems.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
          {statusItems.map((item, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: isDark ? alpha('#FFFFFF', 0.04) : '#FFFFFF',
                border: '1px solid',
                borderColor: 'divider',
                minWidth: 120,
              }}
            >
              <IconCircle
                icon={item.icon as React.ReactElement}
                color={item.color || '#3B82F6'}
                size="sm"
              />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>
                  {item.label}
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  {item.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {children}
    </Card>
  );
}
