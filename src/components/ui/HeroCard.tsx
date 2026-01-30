'use client';

import { Box, Typography, Card, SxProps, Theme } from '@mui/material';
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
  const displayGreeting = greeting ?? getGreeting();

  return (
    <Card
      elevation={0}
      sx={{
        background: 'var(--gradient-hero)',
        color: '#F0F6FC',
        border: 'none',
        p: { xs: 2.5, sm: 3 },
        '&:hover': { boxShadow: 'none', borderColor: 'transparent' },
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400, mb: 0.5 }}>
            {displayGreeting},
          </Typography>
          <Typography variant="h2" sx={{ color: '#FFFFFF', mb: 0.5 }}>
            {userName}
          </Typography>
          {userRole && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {userRole}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <LiveClock showDate sx={{ color: '#FFFFFF' }} />
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
                backgroundColor: 'rgba(255,255,255,0.08)',
                minWidth: 120,
              }}
            >
              <IconCircle
                icon={item.icon as React.ReactElement}
                color={item.color || '#F5C96B'}
                size="sm"
                sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              />
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', lineHeight: 1.2 }}>
                  {item.label}
                </Typography>
                <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
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
