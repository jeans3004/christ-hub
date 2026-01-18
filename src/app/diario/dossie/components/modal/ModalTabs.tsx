/**
 * Abas do modal de dossie.
 */

import { Tabs, Tab } from '@mui/material';
import { Person, Assessment, ReportProblem, CalendarMonth } from '@mui/icons-material';
import { AlunoDossie } from '../../types';

interface ModalTabsProps {
  value: number;
  dossie: AlunoDossie;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

export function ModalTabs({ value, dossie, onChange }: ModalTabsProps) {
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
        label="Informacoes"
        sx={{ minHeight: 56 }}
      />
      <Tab
        icon={<Assessment />}
        iconPosition="start"
        label={`Avaliacoes (${dossie.avaliacoes.length})`}
        sx={{ minHeight: 56 }}
      />
      <Tab
        icon={<ReportProblem />}
        iconPosition="start"
        label={`Ocorrencias (${dossie.ocorrencias.length})`}
        sx={{ minHeight: 56 }}
      />
      <Tab
        icon={<CalendarMonth />}
        iconPosition="start"
        label="Frequencia"
        sx={{ minHeight: 56 }}
      />
    </Tabs>
  );
}
