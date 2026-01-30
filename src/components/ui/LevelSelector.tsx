'use client';

import { Box, Card, CardActionArea, Typography, SxProps, Theme } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ReactElement } from 'react';

interface Level {
  id: string | number;
  label: string;
  description?: string;
  icon?: ReactElement;
}

interface LevelSelectorProps {
  levels: Level[];
  value: string | number | null;
  onChange: (id: string | number) => void;
  sx?: SxProps<Theme>;
}

export default function LevelSelector({ levels, value, onChange, sx }: LevelSelectorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, ...sx }}>
      {levels.map((level) => {
        const selected = value === level.id;
        return (
          <Card
            key={level.id}
            elevation={0}
            sx={{
              borderColor: selected
                ? theme.palette.primary.main
                : isDark
                  ? '#21262D'
                  : '#E2E8F0',
              borderWidth: selected ? 2 : 1,
              borderStyle: 'solid',
              backgroundColor: selected
                ? alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04)
                : theme.palette.background.paper,
              transition: 'all 0.15s ease',
            }}
          >
            <CardActionArea
              onClick={() => onChange(level.id)}
              sx={{ borderRadius: 'inherit' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                {level.icon && (
                  <Box
                    sx={{
                      color: selected ? theme.palette.primary.main : 'text.secondary',
                      display: 'flex',
                      '& .MuiSvgIcon-root': { fontSize: 24 },
                    }}
                  >
                    {level.icon}
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: selected ? theme.palette.primary.main : 'text.primary',
                    }}
                  >
                    {level.label}
                  </Typography>
                  {level.description && (
                    <Typography variant="body2" sx={{ mt: 0.25 }}>
                      {level.description}
                    </Typography>
                  )}
                </Box>
                {selected && (
                  <CheckCircleIcon
                    sx={{ color: theme.palette.primary.main, fontSize: 22, flexShrink: 0 }}
                  />
                )}
              </Box>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
}
