'use client';

import { useState } from 'react';
import { Box, IconButton, Tooltip, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { Refresh, InfoOutlined } from '@mui/icons-material';
import { useChat } from '../../hooks/useChat';
import { ChatList } from './ChatList';
import { ChatThread } from './ChatThread';
import { ChatTabs } from './ChatTabs';
import { ChatSidebar } from './ChatSidebar';

interface ConversasTabProps {
  active: boolean;
}

export function ConversasTab({ active }: ConversasTabProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    openTabs,
    closeTab,
  } = useChat(active);

  // Mobile: mostra lista OU thread
  if (isMobile) {
    if (selectedJid) {
      return (
        <Box sx={{ height: 'calc(100vh - 300px)', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
          {/* Mobile tabs as pills */}
          {openTabs.length > 0 && (
            <ChatTabs
              tabs={openTabs}
              activeJid={selectedJid}
              onSelect={selectChat}
              onClose={closeTab}
            />
          )}
          <Box sx={{ flex: 1, minHeight: 0 }}>
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
              onToggleSidebar={() => setSidebarOpen(true)}
            />
          </Box>
          {/* Mobile CRM drawer */}
          <Drawer
            anchor="right"
            open={sidebarOpen && !!selectedChat}
            onClose={() => setSidebarOpen(false)}
            PaperProps={{ sx: { width: 300 } }}
          >
            {selectedChat && (
              <ChatSidebar
                chat={selectedChat}
                onClose={() => setSidebarOpen(false)}
              />
            )}
          </Drawer>
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

  // Desktop: 3-column layout (List | Thread | CRM)
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

      {/* Center: Tabs + Thread */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {openTabs.length > 0 && (
          <ChatTabs
            tabs={openTabs}
            activeJid={selectedJid}
            onSelect={selectChat}
            onClose={closeTab}
          />
        )}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ChatThread
            chat={selectedChat}
            messages={messages}
            loading={loadingMessages}
            sending={sending}
            onSend={sendMessage}
            sendError={sendError}
            onClearSendError={clearSendError}
            onBack={deselectChat}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          />
        </Box>
      </Box>

      {/* Right: CRM Sidebar */}
      {sidebarOpen && selectedChat && (
        <ChatSidebar
          chat={selectedChat}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </Box>
  );
}
