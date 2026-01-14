/**
 * Acoes do header (ajuda, notificacoes, apps).
 */

import { IconButton, Tooltip, Badge } from '@mui/material';
import { HelpOutline, Notifications, Apps } from '@mui/icons-material';

interface HeaderActionsProps {
  onHelpClick?: () => void;
  onNotificationsClick?: () => void;
  onAppsClick?: () => void;
  notificationCount?: number;
}

export function HeaderActions({
  onHelpClick,
  onNotificationsClick,
  onAppsClick,
  notificationCount = 0,
}: HeaderActionsProps) {
  return (
    <>
      <Tooltip title="Ajuda">
        <IconButton
          color="inherit"
          size="small"
          onClick={onHelpClick}
          aria-label="ajuda"
        >
          <HelpOutline />
        </IconButton>
      </Tooltip>

      <Tooltip title="Notificações">
        <IconButton
          color="inherit"
          size="small"
          onClick={onNotificationsClick}
          aria-label="notificacoes"
        >
          <Badge badgeContent={notificationCount} color="error">
            <Notifications />
          </Badge>
        </IconButton>
      </Tooltip>

      <Tooltip title="Apps">
        <IconButton
          color="inherit"
          size="small"
          onClick={onAppsClick}
          aria-label="aplicativos"
        >
          <Apps />
        </IconButton>
      </Tooltip>
    </>
  );
}
