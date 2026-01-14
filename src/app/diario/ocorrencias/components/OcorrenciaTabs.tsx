/**
 * Componente de tabs para ocorrencias.
 */

import { Box, Paper, Tabs, Tab } from '@mui/material';
import { Check, Edit, Cancel, Undo, Print, History } from '@mui/icons-material';
import DataTable from '@/components/ui/DataTable';
import { Ocorrencia } from '@/types';
import { TabPanel } from './TabPanel';
import { COLUMNS_PENDENTES, COLUMNS_APROVADAS, COLUMNS_HISTORICO } from '../types';

interface OcorrenciaTabsProps {
  tabValue: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  pendentes: Ocorrencia[];
  aprovadas: Ocorrencia[];
  canceladas: Ocorrencia[];
  onAprovar: (ocorrencia: Ocorrencia) => void;
  onEditar: (ocorrencia: Ocorrencia) => void;
  onCancelar: (ocorrencia: Ocorrencia) => void;
  onDevolver: (ocorrencia: Ocorrencia) => void;
  onPrint: (ocorrencia: Ocorrencia) => void;
}

export function OcorrenciaTabs({
  tabValue,
  onTabChange,
  pendentes,
  aprovadas,
  canceladas,
  onAprovar,
  onEditar,
  onCancelar,
  onDevolver,
  onPrint,
}: OcorrenciaTabsProps) {
  const actionsPendentes = [
    {
      icon: <Check />,
      label: 'Aprovar',
      onClick: onAprovar,
      color: 'success' as const,
    },
    {
      icon: <Edit />,
      label: 'Editar',
      onClick: onEditar,
      color: 'primary' as const,
    },
    {
      icon: <Cancel />,
      label: 'Cancelar',
      onClick: onCancelar,
      color: 'error' as const,
    },
  ];

  const actionsAprovadas = [
    {
      icon: <Undo />,
      label: 'Devolver',
      onClick: onDevolver,
      color: 'warning' as const,
    },
    {
      icon: <Print />,
      label: 'Imprimir',
      onClick: onPrint,
      color: 'primary' as const,
    },
  ];

  const actionsCanceladas = [
    {
      icon: <Undo />,
      label: 'Devolver',
      onClick: onDevolver,
      color: 'warning' as const,
    },
  ];

  return (
    <Paper sx={{ flex: 1, p: 2 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={onTabChange}>
          <Tab label={`Pendentes (${pendentes.length})`} />
          <Tab label={`Aprovadas (${aprovadas.length})`} />
          <Tab label={`Canceladas (${canceladas.length})`} />
          <Tab label="Histórico" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <DataTable
          columns={COLUMNS_PENDENTES}
          data={pendentes}
          actions={actionsPendentes}
          rowKey="id"
          emptyMessage="Nenhuma ocorrência pendente"
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <DataTable
          columns={COLUMNS_APROVADAS}
          data={aprovadas}
          actions={actionsAprovadas}
          rowKey="id"
          emptyMessage="Nenhuma ocorrência aprovada"
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <DataTable
          columns={COLUMNS_PENDENTES}
          data={canceladas}
          actions={actionsCanceladas}
          rowKey="id"
          emptyMessage="Nenhuma ocorrência cancelada"
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <DataTable
          columns={COLUMNS_HISTORICO}
          data={[]}
          actions={[
            {
              icon: <History />,
              label: 'Histórico',
              onClick: () => {},
              color: 'primary',
            },
          ]}
          rowKey="id"
          emptyMessage="Pesquise um aluno para ver o histórico"
        />
      </TabPanel>
    </Paper>
  );
}
