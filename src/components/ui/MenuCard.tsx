'use client';

import { Card, CardActionArea, Typography, Box, SvgIconProps, useTheme, alpha } from '@mui/material';
import { useRouter } from 'next/navigation';

interface MenuCardProps {
  title: string;
  icon: React.ReactElement<SvgIconProps>;
  href: string;
  variant?: 'filled' | 'outlined' | 'elevated';
}

export default function MenuCard({ title, icon, href, variant = 'filled' }: MenuCardProps) {
  const router = useRouter();
  const theme = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          bgcolor: 'transparent',
          border: `1px solid ${theme.palette.outline.main}`,
          boxShadow: 'none',
          '& .card-icon': {
            color: theme.palette.primary.main,
          },
          '& .card-title': {
            color: theme.palette.onSurface.main,
          },
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
        };
      case 'elevated':
        return {
          bgcolor: theme.palette.surfaceContainerLow.main,
          boxShadow: theme.shadows[1],
          '& .card-icon': {
            color: theme.palette.primary.main,
          },
          '& .card-title': {
            color: theme.palette.onSurface.main,
          },
          '&:hover': {
            boxShadow: theme.shadows[2],
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
        };
      case 'filled':
      default:
        return {
          bgcolor: theme.palette.primaryContainer.main,
          boxShadow: 'none',
          '& .card-icon': {
            color: theme.palette.onPrimaryContainer.main,
          },
          '& .card-title': {
            color: theme.palette.onPrimaryContainer.main,
          },
          '&:hover': {
            bgcolor: alpha(theme.palette.primaryContainer.main, 0.92),
          },
        };
    }
  };

  return (
    <Card
      sx={{
        minWidth: 140,
        maxWidth: 160,
        height: 140,
        borderRadius: 3, // 12dp - medium
        transition: 'all 200ms cubic-bezier(0.2, 0.0, 0, 1.0)',
        ...getVariantStyles(),
      }}
    >
      <CardActionArea
        onClick={() => router.push(href)}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box className="card-icon" sx={{ display: 'flex' }}>
            {icon}
          </Box>
          <Typography
            variant="subtitle1"
            className="card-title"
            sx={{
              fontWeight: 500,
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}
