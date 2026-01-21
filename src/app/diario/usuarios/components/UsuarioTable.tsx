'use client';

/**
 * Tabela de usuários com ações.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Box,
  Typography,
  Avatar,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  LinkOff as UnlinkIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { Usuario } from '@/types';
import { ROLE_DISPLAY_NAMES, ROLE_COLORS } from '@/constants/permissions';
import { UsuarioWithDetails } from '../types';

interface UsuarioTableProps {
  usuarios: UsuarioWithDetails[];
  loading: boolean;
  onEdit: (usuario: Usuario) => void;
  onDelete: (usuario: Usuario) => void;
  onToggleAtivo: (usuario: Usuario) => void;
  onResetVinculacao: (usuario: Usuario) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export default function UsuarioTable({
  usuarios,
  loading,
  onEdit,
  onDelete,
  onToggleAtivo,
  onResetVinculacao,
  canEdit,
  canDelete,
}: UsuarioTableProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, usuario: Usuario) => {
    setMenuAnchor(event.currentTarget);
    setSelectedUsuario(usuario);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedUsuario(null);
  };

  const getStatusChip = (usuario: Usuario) => {
    if (!usuario.ativo) {
      return <Chip label="Inativo" size="small" color="default" />;
    }
    if (usuario.authStatus === 'pending') {
      return <Chip label="Pendente" size="small" color="warning" />;
    }
    return <Chip label="Ativo" size="small" color="success" />;
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Carregando...</Typography>
      </Box>
    );
  }

  if (usuarios.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">Nenhum usuário encontrado</Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Usuário</TableCell>
              <TableCell>E-mail</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Turmas</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow
                key={usuario.id}
                sx={{
                  opacity: usuario.ativo ? 1 : 0.6,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                      {getInitials(usuario.nome)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {usuario.nome}
                      </Typography>
                      {usuario.cpf && (
                        <Typography variant="caption" color="text.secondary">
                          CPF: {usuario.cpf}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{usuario.googleEmail || usuario.email}</Typography>
                  {usuario.celular && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {usuario.celular}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={ROLE_DISPLAY_NAMES[usuario.tipo]}
                    size="small"
                    color={ROLE_COLORS[usuario.tipo]}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {usuario.turmasNomes?.slice(0, 3).map((turma, idx) => (
                      <Chip key={idx} label={turma} size="small" variant="outlined" />
                    ))}
                    {usuario.turmasNomes && usuario.turmasNomes.length > 3 && (
                      <Chip
                        label={`+${usuario.turmasNomes.length - 3}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </TableCell>
                <TableCell>{getStatusChip(usuario)}</TableCell>
                <TableCell align="right">
                  {canEdit && (
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => onEdit(usuario)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Mais opções">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, usuario)}>
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Menu de Opções */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {canEdit && (
          <MenuItem
            onClick={() => {
              if (selectedUsuario) onToggleAtivo(selectedUsuario);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              {selectedUsuario?.ativo ? <BlockIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{selectedUsuario?.ativo ? 'Desativar' : 'Ativar'}</ListItemText>
          </MenuItem>
        )}
        {canEdit && selectedUsuario?.authStatus === 'linked' && (
          <MenuItem
            onClick={() => {
              if (selectedUsuario) onResetVinculacao(selectedUsuario);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <UnlinkIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Resetar Vinculação</ListItemText>
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem
            onClick={() => {
              if (selectedUsuario) onDelete(selectedUsuario);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
