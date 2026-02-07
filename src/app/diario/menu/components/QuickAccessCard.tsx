'use client';

import { Box, Typography, Card, CardActionArea } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ArrowForward } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface QuickAccessCardProps {
  title: string;
  icon: React.ReactNode;
  href: string;
  color?: string;
}

export function QuickAccessCard({ title, icon, href, color = '#6B7280' }: QuickAccessCardProps) {
  const router = useRouter();
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
        transition: 'all 200ms ease',
        '&:hover': {
          borderColor: isDark ? alpha('#3B82F6', 0.3) : alpha('#3B82F6', 0.25),
          '& .arrow-icon': {
            opacity: 1,
            transform: 'translateX(0)',
          },
        },
      }}
    >
      <CardActionArea
        onClick={() => router.push(href)}
        sx={{
          p: 2.5,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: isDark ? alpha(color, 0.12) : alpha(color, 0.06),
            color: isDark ? alpha(color, 0.9) : color,
            '& .MuiSvgIcon-root': { fontSize: 22 },
          }}
        >
          {icon}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'text.primary',
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </Typography>
          <ArrowForward
            className="arrow-icon"
            sx={{
              fontSize: 16,
              color: 'text.secondary',
              opacity: 0,
              transform: 'translateX(-4px)',
              transition: 'all 200ms ease',
            }}
          />
        </Box>
      </CardActionArea>
    </Card>
  );
}
