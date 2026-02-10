'use client';

import { Box, Typography, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { ChatTab } from '../../hooks/useChat';

interface ChatTabsProps {
  tabs: ChatTab[];
  activeJid: string | null;
  onSelect: (jid: string) => void;
  onClose: (jid: string) => void;
}

export function ChatTabs({ tabs, activeJid, onSelect, onClose }: ChatTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        px: 0.5,
        py: 0.25,
        overflowX: 'auto',
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? '#111B21' : '#F0F2F5',
        minHeight: 36,
        '&::-webkit-scrollbar': { height: 3 },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'rgba(0,0,0,0.2)',
          borderRadius: 2,
        },
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.jid === activeJid;
        return (
          <Box
            key={tab.jid}
            onClick={() => onSelect(tab.jid)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.25,
              py: 0.375,
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              flexShrink: 0,
              maxWidth: 180,
              bgcolor: isActive
                ? (theme) =>
                    theme.palette.mode === 'dark' ? '#005C4B' : '#D9FDD3'
                : 'transparent',
              '&:hover': {
                bgcolor: isActive
                  ? undefined
                  : (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.04)',
              },
              transition: 'background-color 0.15s',
            }}
          >
            <Typography
              noWrap
              sx={{
                fontSize: '0.75rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive
                  ? (theme) =>
                      theme.palette.mode === 'dark' ? '#E9EDEF' : '#111B21'
                  : (theme) =>
                      theme.palette.mode === 'dark' ? '#8696A0' : '#667781',
                lineHeight: 1.3,
              }}
            >
              {tab.name}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.jid);
              }}
              sx={{
                p: 0.125,
                ml: 0.25,
                opacity: isActive ? 0.8 : 0.4,
                '&:hover': { opacity: 1 },
                '& .MuiSvgIcon-root': { fontSize: '0.85rem' },
              }}
            >
              <Close />
            </IconButton>
          </Box>
        );
      })}
    </Box>
  );
}
