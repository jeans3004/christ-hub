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
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        transition: 'all 150ms ease',
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: 1,
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
          justifyContent: 'flex-start',
        }}
      >
        <Box sx={{ color: 'primary.main', mb: 1.5 }}>
          {icon}
        </Box>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
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
