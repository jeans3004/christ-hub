'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import { useState, useMemo } from 'react';

interface Column<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface Action<T> {
  icon: React.ReactNode;
  label: string;
  onClick: (row: T) => void;
  color?: 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'info';
  show?: (row: T) => boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: Action<T>[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey: keyof T;
  pagination?: boolean;
  initialRowsPerPage?: number;
}

type Order = 'asc' | 'desc';

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  actions,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado',
  rowKey,
  pagination = true,
  initialRowsPerPage = 10,
}: DataTableProps<T>) {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder] = useState<Order>('asc');

  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedData = useMemo(() => {
    if (!orderBy) return data;

    return [...data].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return order === 'asc' ? comparison : -comparison;
    });
  }, [data, orderBy, order]);

  const paginatedData = pagination
    ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : sortedData;

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 6,
          bgcolor: 'surfaceContainerLow.main',
          borderRadius: 3,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: 3,
        bgcolor: 'surfaceContainerLow.main',
      }}
    >
      <TableContainer>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || 'left'}
                  sx={{
                    minWidth: column.minWidth,
                    bgcolor: 'surfaceContainerHigh.main',
                    color: 'onSurface.main',
                    fontWeight: 500,
                    borderBottom: 1,
                    borderColor: 'outlineVariant.main',
                  }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(String(column.id))}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions && actions.length > 0 && (
                <TableCell
                  align="center"
                  sx={{
                    minWidth: 100,
                    bgcolor: 'surfaceContainerHigh.main',
                    color: 'onSurface.main',
                    fontWeight: 500,
                    borderBottom: 1,
                    borderColor: 'outlineVariant.main',
                  }}
                >
                  Acoes
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  align="center"
                  sx={{ py: 6 }}
                >
                  <Typography color="text.secondary">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow
                  hover
                  key={String(row[rowKey])}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  {columns.map((column) => {
                    const value = row[column.id as keyof T];
                    return (
                      <TableCell
                        key={String(column.id)}
                        align={column.align || 'left'}
                        sx={{
                          borderColor: 'outlineVariant.main',
                        }}
                      >
                        {column.format ? column.format(value, row) : value}
                      </TableCell>
                    );
                  })}
                  {actions && actions.length > 0 && (
                    <TableCell
                      align="center"
                      sx={{
                        borderColor: 'outlineVariant.main',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {actions.map((action, index) => {
                          if (action.show && !action.show(row)) return null;
                          return (
                            <Tooltip key={index} title={action.label}>
                              <IconButton
                                size="small"
                                color={action.color || 'primary'}
                                onClick={() => action.onClick(row)}
                                aria-label={action.label}
                              >
                                {action.icon}
                              </IconButton>
                            </Tooltip>
                          );
                        })}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && data.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por pagina:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
          sx={{
            borderTop: 1,
            borderColor: 'outlineVariant.main',
          }}
        />
      )}
    </Paper>
  );
}
