/**
 * Item individual da arvore de disciplinas.
 */

'use client';

import { Box, Typography, IconButton, Chip, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  MenuBook,
  Folder,
  FolderOpen,
  Edit,
  Delete,
  Add,
  MoreVert,
  ChevronRight,
  ExpandMore,
} from '@mui/icons-material';
import { useState } from 'react';
import { DisciplinaNode } from '../types';

interface DisciplinaTreeItemProps {
  node: DisciplinaNode;
  isExpanded: boolean;
  canAddChild: boolean;
  onToggle: () => void;
  onEdit: (node: DisciplinaNode) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (node: DisciplinaNode) => void;
}

export function DisciplinaTreeItem({
  node,
  isExpanded,
  canAddChild,
  onToggle,
  onEdit,
  onAddChild,
  onDelete,
}: DisciplinaTreeItemProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(node);
  };

  const handleAddChild = () => {
    handleMenuClose();
    onAddChild(node.id);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(node);
  };

  // Icone baseado se e grupo ou disciplina
  const isGroup = node.isGroup === true;
  const Icon = isGroup ? (isExpanded ? FolderOpen : Folder) : MenuBook;
  const iconColor = isGroup ? 'warning.main' : 'primary.main';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 1,
        px: 1,
        ml: node.level * 3,
        borderRadius: 1,
        bgcolor: isGroup ? 'warning.lighter' : 'transparent',
        '&:hover': { bgcolor: isGroup ? 'warning.light' : 'action.hover' },
        cursor: node.hasChildren ? 'pointer' : 'default',
      }}
      onClick={node.hasChildren ? onToggle : undefined}
    >
      {/* Expand/Collapse */}
      <Box sx={{ width: 28, display: 'flex', justifyContent: 'center' }}>
        {node.hasChildren ? (
          <IconButton size="small" onClick={onToggle}>
            {isExpanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
        ) : (
          <Box sx={{ width: 28 }} />
        )}
      </Box>

      {/* Icon */}
      <Icon sx={{ color: iconColor, mr: 1.5, fontSize: 20 }} />

      {/* Name */}
      <Typography
        sx={{
          fontWeight: isGroup ? 600 : 500,
          flex: 1,
          color: node.ativo ? 'text.primary' : 'text.disabled',
        }}
      >
        {node.nome}
      </Typography>

      {/* Codigo - apenas se nao for grupo */}
      {!isGroup && node.codigo && (
        <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
          {node.codigo}
        </Typography>
      )}

      {/* Badge de grupo */}
      {isGroup && (
        <Tooltip title="Grupo organizacional - nao aparece em selecoes">
          <Chip
            label="Grupo"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ mr: 1, height: 22 }}
          />
        </Tooltip>
      )}

      {/* Children count */}
      {node.hasChildren && (
        <Tooltip title={`${node.children.length} subdisciplina(s)`}>
          <Chip
            label={node.children.length}
            size="small"
            variant="outlined"
            sx={{ mr: 1, minWidth: 28, height: 22 }}
          />
        </Tooltip>
      )}

      {/* Status */}
      {!node.ativo && (
        <Chip label="Inativa" size="small" color="default" sx={{ mr: 1 }} />
      )}

      {/* Actions Menu */}
      <IconButton size="small" onClick={handleMenuOpen}>
        <MoreVert fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        {canAddChild && (
          <MenuItem onClick={handleAddChild}>
            <ListItemIcon><Add fontSize="small" /></ListItemIcon>
            <ListItemText>Adicionar Subdisciplina</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Desativar</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
