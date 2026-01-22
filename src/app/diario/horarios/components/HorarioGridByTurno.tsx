/**
 * Grade de horarios por turno (Matutino/Vespertino).
 * Colunas: Turmas do turno
 * Linhas: Dias x Tempos (7 tempos por dia, 5 dias = 35 linhas)
 */

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Paper,
  Chip,
} from '@mui/material';
import { DiaSemana, DiasSemanaNomesAbrev, HorarioAula, Turma, Disciplina, Usuario, HorarioSlot } from '@/types';

const DIAS_SEMANA: DiaSemana[] = [1, 2, 3, 4, 5]; // Segunda a Sexta

// Slots Matutino
const MATUTINO_SLOTS: HorarioSlot[] = [
  { horaInicio: '07:00', horaFim: '07:45', label: '1º' },
  { horaInicio: '07:45', horaFim: '08:30', label: '2º' },
  { horaInicio: '08:30', horaFim: '09:15', label: '3º' },
  { horaInicio: '09:15', horaFim: '10:00', label: '4º' },
  { horaInicio: '10:00', horaFim: '10:45', label: '5º' },
  { horaInicio: '10:45', horaFim: '11:30', label: '6º' },
  { horaInicio: '11:30', horaFim: '12:15', label: '7º' },
];

// Slots Vespertino
const VESPERTINO_SLOTS: HorarioSlot[] = [
  { horaInicio: '13:00', horaFim: '13:45', label: '1º' },
  { horaInicio: '13:45', horaFim: '14:30', label: '2º' },
  { horaInicio: '14:30', horaFim: '15:15', label: '3º' },
  { horaInicio: '15:15', horaFim: '16:00', label: '4º' },
  { horaInicio: '16:00', horaFim: '16:45', label: '5º' },
  { horaInicio: '16:45', horaFim: '17:30', label: '6º' },
  { horaInicio: '17:30', horaFim: '18:15', label: '7º' },
];

// Slots Sexta Vespertino (35 min)
const SEXTA_VESPERTINO_SLOTS: HorarioSlot[] = [
  { horaInicio: '13:00', horaFim: '13:35', label: '1º' },
  { horaInicio: '13:35', horaFim: '14:10', label: '2º' },
  { horaInicio: '14:10', horaFim: '14:45', label: '3º' },
  { horaInicio: '14:45', horaFim: '15:20', label: '4º' },
  { horaInicio: '15:20', horaFim: '15:55', label: '5º' },
  { horaInicio: '15:55', horaFim: '16:30', label: '6º' },
  { horaInicio: '16:30', horaFim: '17:05', label: '7º' },
];

interface HorarioGridByTurnoProps {
  turno: 'Matutino' | 'Vespertino';
  horarios: HorarioAula[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  professores: Usuario[];
  canEdit: boolean;
  onCellClick: (horario?: HorarioAula, slot?: { dia: DiaSemana; slot: HorarioSlot; turmaId: string }) => void;
}

export function HorarioGridByTurno({
  turno,
  horarios,
  turmas,
  disciplinas,
  professores,
  canEdit,
  onCellClick,
}: HorarioGridByTurnoProps) {
  // Filtrar turmas pelo turno e ordenar: Fundamental primeiro, depois Médio
  const turmasFiltradas = turmas
    .filter(t => t.turno === turno && t.ativo !== false)
    .sort((a, b) => {
      // Ordenar por ensino: Fundamental II antes de Médio
      const ensinoOrder: Record<string, number> = {
        'Ensino Fundamental II': 1,
        'Ensino Médio': 2,
      };
      const orderA = ensinoOrder[a.ensino || ''] || 99;
      const orderB = ensinoOrder[b.ensino || ''] || 99;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Mesmo ensino: ordenar por série (6º, 7º, 8º, 9º, 1ª, 2ª, 3ª)
      const serieA = a.serie || '';
      const serieB = b.serie || '';

      // Extrair número da série
      const numA = parseInt(serieA.match(/\d+/)?.[0] || '99');
      const numB = parseInt(serieB.match(/\d+/)?.[0] || '99');

      if (numA !== numB) {
        return numA - numB;
      }

      // Mesma série: ordenar por turma (A, B, C)
      return (a.turma || '').localeCompare(b.turma || '');
    });

  if (turmasFiltradas.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Nenhuma turma {turno.toLowerCase()} encontrada
        </Typography>
      </Paper>
    );
  }

  // Obter slots baseado no turno
  const getSlots = (dia: DiaSemana) => {
    if (turno === 'Vespertino' && dia === 5) {
      return SEXTA_VESPERTINO_SLOTS;
    }
    return turno === 'Matutino' ? MATUTINO_SLOTS : VESPERTINO_SLOTS;
  };

  // Buscar horario para uma turma/dia/slot
  const getHorario = (turmaId: string, dia: DiaSemana, slot: HorarioSlot) => {
    return horarios.find(
      h => h.turmaId === turmaId && h.diaSemana === dia && h.horaInicio === slot.horaInicio
    ) || null;
  };

  // Gerar linhas (dia + tempo)
  const rows: { dia: DiaSemana; slotIndex: number; slot: HorarioSlot; isFirstOfDay: boolean }[] = [];
  DIAS_SEMANA.forEach(dia => {
    const slots = getSlots(dia);
    slots.forEach((slot, index) => {
      rows.push({
        dia,
        slotIndex: index,
        slot,
        isFirstOfDay: index === 0,
      });
    });
  });

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                width: 100,
                bgcolor: 'background.paper',
                borderRight: 1,
                borderColor: 'divider',
                position: 'sticky',
                left: 0,
                zIndex: 3,
              }}
            >
              <Typography variant="caption" fontWeight={600}>
                Dia/Tempo
              </Typography>
            </TableCell>
            {turmasFiltradas.map(turma => (
              <TableCell
                key={turma.id}
                align="center"
                sx={{
                  minWidth: 120,
                  bgcolor: 'background.paper',
                  borderBottom: 2,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                  {turma.nome}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow
              key={`${row.dia}-${row.slotIndex}`}
              sx={{
                bgcolor: row.isFirstOfDay ? 'action.hover' : 'inherit',
                borderTop: row.isFirstOfDay ? 2 : 0,
                borderColor: 'divider',
              }}
            >
              <TableCell
                sx={{
                  bgcolor: row.isFirstOfDay ? 'primary.main' : 'background.default',
                  color: row.isFirstOfDay ? 'primary.contrastText' : 'text.primary',
                  borderRight: 1,
                  borderColor: 'divider',
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                  py: 0.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {row.isFirstOfDay && (
                    <Chip
                      label={DiasSemanaNomesAbrev[row.dia]}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        bgcolor: 'primary.dark',
                        color: 'primary.contrastText',
                      }}
                    />
                  )}
                  <Typography variant="caption" fontWeight={500}>
                    {row.slot.label}
                  </Typography>
                </Box>
              </TableCell>
              {turmasFiltradas.map(turma => {
                const horario = getHorario(turma.id, row.dia, row.slot);
                const disciplina = horario ? disciplinas.find(d => d.id === horario.disciplinaId) : null;
                const professor = horario ? professores.find(p => p.id === horario.professorId) : null;

                return (
                  <TableCell
                    key={turma.id}
                    align="center"
                    onClick={() => canEdit && onCellClick(horario || undefined, { dia: row.dia, slot: row.slot, turmaId: turma.id })}
                    sx={{
                      p: 0.5,
                      cursor: canEdit ? 'pointer' : 'default',
                      '&:hover': canEdit ? { bgcolor: 'action.hover' } : {},
                      borderRight: 1,
                      borderColor: 'divider',
                      minHeight: 40,
                    }}
                  >
                    {horario ? (
                      <Box
                        sx={{
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          borderRadius: 1,
                          p: 0.5,
                          minHeight: 32,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            display: 'block',
                            lineHeight: 1.2,
                          }}
                        >
                          {disciplina?.nome?.substring(0, 15) || '?'}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.55rem',
                            opacity: 0.9,
                            display: 'block',
                            lineHeight: 1.1,
                          }}
                        >
                          {professor?.nome?.split(' ')[0] || '?'}
                        </Typography>
                        {horario.sala && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.5rem',
                              opacity: 0.8,
                            }}
                          >
                            {horario.sala}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {canEdit && (
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                            +
                          </Typography>
                        )}
                      </Box>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
