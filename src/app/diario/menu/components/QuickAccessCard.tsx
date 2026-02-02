/**
 * Card de acesso rapido para o menu.
 */

'use client';

import { Box, Typography, Card, CardActionArea } from '@mui/material';
import { useRouter } from 'next/navigation';

interface QuickAccessCardProps {
  title: string;
  icon: React.ReactNode;
  href: string;
}

export function QuickAccessCard({ title, icon, href }: QuickAccessCardProps) {
  const router = useRouter();

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: '12px',
        transition: 'all 150ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardActionArea
        onClick={() => router.push(href)}
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          gap: 1.5,
        }}
      >
        <Box sx={{ color: '#6B7280' }}>
          {icon}
        </Box>
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '1rem',
            color: 'text.primary',
            lineHeight: 1.4,
          }}
        >
          {title}
        </Typography>
      </CardActionArea>
    </Card>
  );
}
