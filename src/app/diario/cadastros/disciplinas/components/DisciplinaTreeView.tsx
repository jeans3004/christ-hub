/**
 * Visualizacao em arvore das disciplinas.
 */

'use client';

import { useState, useCallback } from 'react';
import { Box, Paper, Typography, Button, Collapse, CircularProgress } from '@mui/material';
import { ExpandMore, ChevronRight, Folder, MenuBook } from '@mui/icons-material';
import { DisciplinaNode } from '../types';
import { DisciplinaTreeItem } from './DisciplinaTreeItem';

interface DisciplinaTreeViewProps {
  tree: DisciplinaNode[];
  loading: boolean;
  canHaveChildren: (id: string) => boolean;
  onEdit: (node: DisciplinaNode) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (node: DisciplinaNode) => void;
}

export function DisciplinaTreeView({
  tree,
  loading,
  canHaveChildren,
  onEdit,
  onAddChild,
  onDelete,
}: DisciplinaTreeViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const handleToggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collect = (nodes: DisciplinaNode[]) => {
      nodes.forEach(node => {
        if (node.hasChildren) {
          allIds.add(node.id);
          collect(node.children);
        }
      });
    };
    collect(tree);
    setExpanded(allIds);
  }, [tree]);

  const handleCollapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  const renderNode = (node: DisciplinaNode): React.ReactNode => {
    const isExpanded = expanded.has(node.id);

    return (
      <Box key={node.id}>
        <DisciplinaTreeItem
          node={node}
          isExpanded={isExpanded}
          canAddChild={canHaveChildren(node.id)}
          onToggle={() => handleToggle(node.id)}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
        />
        {node.hasChildren && (
          <Collapse in={isExpanded} timeout="auto">
            <Box>{node.children.map(renderNode)}</Box>
          </Collapse>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (tree.length === 0) {
    return null; // EmptyState sera renderizado pelo page.tsx
  }

  const hasExpandable = tree.some(n => n.hasChildren);

  return (
    <Paper sx={{ p: 2 }}>
      {/* Toolbar */}
      {hasExpandable && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Button
            size="small"
            startIcon={<ExpandMore />}
            onClick={handleExpandAll}
            sx={{ textTransform: 'none' }}
          >
            Expandir Todos
          </Button>
          <Button
            size="small"
            startIcon={<ChevronRight />}
            onClick={handleCollapseAll}
            sx={{ textTransform: 'none' }}
          >
            Recolher Todos
          </Button>
        </Box>
      )}

      {/* Tree */}
      <Box>{tree.map(renderNode)}</Box>

      {/* Legend */}
      <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Folder fontSize="small" sx={{ color: 'warning.main' }} />
          Grupo (organizacional)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <MenuBook fontSize="small" sx={{ color: 'primary.main' }} />
          Disciplina (selecionavel)
        </Typography>
      </Box>
    </Paper>
  );
}
