/**
 * Barra de acoes rapidas para mensagens.
 */

'use client';

import { Box, Button, Tooltip, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useQuickActions } from '../hooks';
import { QuickActionType } from '../types';

interface QuickActionsBarProps {
  onActionClick: (actionId: QuickActionType) => void;
  disabled?: boolean;
}

export function QuickActionsBar({ onActionClick, disabled }: QuickActionsBarProps) {
  const { quickActions } = useQuickActions();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'grey.50',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
        Acoes Rapidas
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        {quickActions.map((action) => (
          <Tooltip key={action.id} title={action.description} arrow>
            <span>
              <Button
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
                color={action.color}
                onClick={() => onActionClick(action.id)}
                disabled={disabled}
                sx={{
                  minWidth: isMobile ? 'auto' : 100,
                  textTransform: 'none',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{action.icon}</span>
                  {!isMobile && <span>{action.label}</span>}
                </Box>
              </Button>
            </span>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
}
