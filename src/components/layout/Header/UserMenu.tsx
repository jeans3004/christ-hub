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
import { alpha, useTheme } from '@mui/material/styles';
import {
  Logout,
  School,
  SupervisorAccount,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/permissions';

const getRoleConfig = (role: UserRole) => {
  switch (role) {
    case 'administrador':
      return { icon: <AdminPanelSettings sx={{ fontSize: 14 }} />, color: '#EF4444', label: 'Admin' };
    case 'coordenador':
      return { icon: <SupervisorAccount sx={{ fontSize: 14 }} />, color: '#3B82F6', label: 'Coord' };
    case 'professor':
    default:
      return { icon: <School sx={{ fontSize: 14 }} />, color: '#8B5CF6', label: 'Prof' };
  }
};

export function UserMenu() {
  const { user, usuario, logout } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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

  const roleConfig = getRoleConfig(usuario.tipo);

  return (
    <>
      <Tooltip title="Conta">
        <IconButton
          onClick={handleOpenMenu}
          aria-label="conta do usuario"
          aria-controls={anchorEl ? 'user-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={anchorEl ? 'true' : undefined}
          sx={{
            p: 0.5,
            borderRadius: '12px',
            '&:hover': {
              bgcolor: isDark ? alpha('#FFFFFF', 0.06) : alpha('#000000', 0.04),
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={user?.photoURL || undefined}
              sx={{
                width: 30,
                height: 30,
                bgcolor: isDark ? alpha('#3B82F6', 0.2) : alpha('#3B82F6', 0.1),
                color: '#3B82F6',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              {usuario.nome.charAt(0).toUpperCase()}
            </Avatar>
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 0.75,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'text.primary',
                  lineHeight: 1,
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {usuario.nome.split(' ')[0]}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: '6px',
                  bgcolor: alpha(roleConfig.color, isDark ? 0.15 : 0.08),
                  color: roleConfig.color,
                }}
              >
                {roleConfig.icon}
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.02em' }}>
                  {roleConfig.label}
                </Typography>
              </Box>
            </Box>
          </Box>
        </IconButton>
      </Tooltip>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 220,
              mt: 1,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: isDark
                ? '0 8px 24px rgba(0,0,0,0.4)'
                : '0 8px 24px rgba(0,0,0,0.08)',
            },
          },
        }}
      >
        <MenuItem disabled sx={{ opacity: 1 }}>
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {usuario.nome}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {usuario.email}
            </Typography>
          </Box>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={handleLogout}
          sx={{
            mx: 0.5,
            borderRadius: 1,
            fontSize: '0.875rem',
            color: 'text.secondary',
            '&:hover': { color: 'error.main' },
          }}
        >
          <Logout sx={{ fontSize: 16, mr: 1.5 }} />
          Sair
        </MenuItem>
      </Menu>
    </>
  );
}
