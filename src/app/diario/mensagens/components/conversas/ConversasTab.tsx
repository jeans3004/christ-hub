'use client';

import { Box, IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useChat } from '../../hooks/useChat';
import { ChatList } from './ChatList';
import { ChatThread } from './ChatThread';

interface ConversasTabProps {
  active: boolean;
}

export function ConversasTab({ active }: ConversasTabProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    chats,
    selectedJid,
    selectedChat,
    messages,
    loadingChats,
    loadingMessages,
    sending,
    sendError,
    clearSendError,
    selectChat,
    deselectChat,
    sendMessage,
    refresh,
  } = useChat(active);

  // Mobile: mostra lista OU thread
  if (isMobile) {
    if (selectedJid) {
      return (
        <Box sx={{ height: 'calc(100vh - 300px)', minHeight: 400 }}>
          <ChatThread
            chat={selectedChat}
            messages={messages}
            loading={loadingMessages}
            sending={sending}
            onSend={sendMessage}
            sendError={sendError}
            onClearSendError={clearSendError}
            onBack={deselectChat}
            showBackButton
          />
        </Box>
      );
    }

    return (
      <Box sx={{ height: 'calc(100vh - 300px)', minHeight: 400 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
          <Tooltip title="Atualizar">
            <IconButton size="small" onClick={refresh}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <ChatList
          chats={chats}
          selectedJid={selectedJid}
          loading={loadingChats}
          onSelect={selectChat}
        />
      </Box>
    );
  }

  // Desktop: split pane
  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 300px)',
        minHeight: 400,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {/* Left: Chat List */}
      <Box
        sx={{
          width: 350,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            px: 1,
            pt: 0.5,
          }}
        >
          <Tooltip title="Atualizar">
            <IconButton size="small" onClick={refresh}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <ChatList
          chats={chats}
          selectedJid={selectedJid}
          loading={loadingChats}
          onSelect={selectChat}
        />
      </Box>

      {/* Right: Chat Thread */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ChatThread
          chat={selectedChat}
          messages={messages}
          loading={loadingMessages}
          sending={sending}
          onSend={sendMessage}
          sendError={sendError}
          onClearSendError={clearSendError}
          onBack={deselectChat}
        />
      </Box>
    </Box>
  );
}
