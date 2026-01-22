/**
 * Abas do modal de dossie.
 */

import { Tabs, Tab } from '@mui/material';
import { Person, Assessment, ReportProblem, CalendarMonth, Description } from '@mui/icons-material';
import { AlunoDossie } from '../../types';

interface ModalTabsProps {
  value: number;
  dossie: AlunoDossie;
  relatoriosCount?: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

export function ModalTabs({ value, dossie, relatoriosCount = 0, onChange }: ModalTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'grey.50',
      }}
    >
      <Tab
        icon={<Person />}
        iconPosition="start"
        label="Informações"
        sx={{ minHeight: 56 }}
      />
      <Tab
        icon={<Assessment />}
        iconPosition="start"
        label={`Avaliações (${dossie.avaliacoes.length})`}
        sx={{ minHeight: 56 }}
      />
      <Tab
        icon={<ReportProblem />}
        iconPosition="start"
        label={`Ocorrências (${dossie.ocorrencias.length})`}
        sx={{ minHeight: 56 }}
      />
      <Tab
        icon={<CalendarMonth />}
        iconPosition="start"
        label="Frequência"
        sx={{ minHeight: 56 }}
      />
      <Tab
        icon={<Description />}
        iconPosition="start"
        label={`Relatórios${relatoriosCount > 0 ? ` (${relatoriosCount})` : ''}`}
        sx={{ minHeight: 56 }}
      />
    </Tabs>
  );
}
