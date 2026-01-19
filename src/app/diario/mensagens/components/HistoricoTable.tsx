'use client';

/**
 * Tabela de historico de mensagens enviadas.
 */

import { useMemo } from 'react';
import {
  Box,
  Chip,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  CheckCircle,
  DoneAll,
  Schedule,
  Error,
  Visibility,
  Refresh,
} from '@mui/icons-material';
import { DataTable } from '@/components/ui';
import { MensagemLog, MensagemStatus } from '@/types';
import { formatPhoneDisplay } from '../types';

interface HistoricoTableProps {
  data: MensagemLog[];
  loading?: boolean;
  onRefresh?: () => void;
}

// Configuracao de status
const STATUS_CONFIG: Record<
  MensagemStatus,
  { label: string; color: 'default' | 'info' | 'success' | 'warning' | 'error'; icon: React.ReactNode }
> = {
  queued: { label: 'Na fila', color: 'default', icon: <Schedule fontSize="small" /> },
  sent: { label: 'Enviada', color: 'info', icon: <CheckCircle fontSize="small" /> },
  delivered: { label: 'Entregue', color: 'success', icon: <DoneAll fontSize="small" /> },
  read: { label: 'Lida', color: 'success', icon: <Visibility fontSize="small" /> },
  failed: { label: 'Falhou', color: 'error', icon: <Error fontSize="small" /> },
};

// Formatar data
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Truncar texto
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

export function HistoricoTable({
  data,
  loading = false,
  onRefresh,
}: HistoricoTableProps) {
  const columns = useMemo(
    () => [
      {
        id: 'enviadoEm' as const,
        label: 'Data/Hora',
        minWidth: 130,
        format: (value: Date) => formatDate(value),
      },
      {
        id: 'destinatarioNome' as const,
        label: 'Destinatario',
        minWidth: 150,
        format: (value: string, row: MensagemLog) => (
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatPhoneDisplay(row.destinatarioNumero)}
            </Typography>
          </Box>
        ),
      },
      {
        id: 'mensagem' as const,
        label: 'Mensagem',
        minWidth: 200,
        format: (value: string) => (
          <Tooltip title={value} placement="top-start">
            <Typography variant="body2" sx={{ cursor: 'pointer' }}>
              {truncate(value, 50)}
            </Typography>
          </Tooltip>
        ),
      },
      {
        id: 'tipo' as const,
        label: 'Tipo',
        minWidth: 100,
        format: (value: string) => (
          <Chip
            label={value === 'broadcast' ? 'Broadcast' : value === 'grupo' ? 'Grupo' : 'Individual'}
            size="small"
            variant="outlined"
            color={value === 'broadcast' ? 'primary' : value === 'grupo' ? 'secondary' : 'default'}
          />
        ),
      },
      {
        id: 'status' as const,
        label: 'Status',
        minWidth: 120,
        format: (value: MensagemStatus, row: MensagemLog) => {
          const config = STATUS_CONFIG[value] || STATUS_CONFIG.queued;
          return (
            <Tooltip title={row.erro || ''}>
              <Chip
                icon={config.icon as React.ReactElement}
                label={config.label}
                size="small"
                color={config.color}
              />
            </Tooltip>
          );
        },
      },
      {
        id: 'enviadoPorNome' as const,
        label: 'Enviado por',
        minWidth: 120,
      },
    ],
    []
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Historico de Envios
        </Typography>
        {onRefresh && (
          <Tooltip title="Atualizar">
            <IconButton onClick={onRefresh} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        rowKey="id"
        emptyMessage="Nenhuma mensagem enviada ainda"
      />
    </Box>
  );
}
