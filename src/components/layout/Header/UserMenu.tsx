/**
 * Menu do usuario com avatar e opcoes.
 */

import { useState } from 'react';
import {
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Logout,
  School,
  SupervisorAccount,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/permissions';

// Configuracao de badge por role
const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case 'administrador':
      return {
        icon: <AdminPanelSettings sx={{ fontSize: 20 }} />,
        color: '#dc2626',
        label: 'Administrador',
      };
    case 'coordenador':
      return {
        icon: <SupervisorAccount sx={{ fontSize: 20 }} />,
        color: '#2563eb',
        label: 'Coordenador',
      };
    case 'professor':
    default:
      return {
        icon: <School sx={{ fontSize: 20 }} />,
        color: '#7c3aed',
        label: 'Professor',
      };
  }
};

export function UserMenu() {
  const { user, usuario, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
  };

  if (!usuario) return null;

  const roleBadge = getRoleBadge(usuario.tipo);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 0.5 }}>
        {/* Role Badge */}
        <Tooltip title={roleBadge.label}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1,
              bgcolor: roleBadge.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: 1,
            }}
          >
            {roleBadge.icon}
          </Box>
        </Tooltip>

        {/* Profile Avatar */}
        <Tooltip title="Conta">
          <IconButton
            onClick={handleOpenMenu}
            aria-label="conta do usuario"
            aria-controls={anchorEl ? 'user-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={anchorEl ? 'true' : undefined}
            sx={{ p: 0 }}
          >
            <Avatar
              src={user?.photoURL || undefined}
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'inherit',
                fontSize: '0.875rem',
              }}
            >
              {usuario.nome.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { minWidth: 220, mt: 1 },
          },
        }}
      >
        <MenuItem disabled sx={{ opacity: 1 }}>
          <Box>
            <Typography variant="body1" fontWeight={500}>
              {usuario.nome}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {usuario.email}
            </Typography>
          </Box>
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleLogout}>
          <Logout fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
          Sair
        </MenuItem>
      </Menu>
    </>
  );
}
