/**
 * Grade de horarios (tabela semanal).
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
} from '@mui/material';
import { DiaSemana, DiasSemanaNomesAbrev, HorarioSlot } from '@/types';
import { HorarioCell } from './HorarioCell';
import { HorarioGridProps } from '../types';

// Dias da semana para exibicao (Segunda a Sexta)
const DIAS_SEMANA: DiaSemana[] = [1, 2, 3, 4, 5];

export function HorarioGrid({
  horarios,
  turmas,
  disciplinas,
  professores,
  timeSlots,
  sextaVespertinoSlots,
  isVespertino,
  canEdit,
  onCellClick,
  viewMode,
}: HorarioGridProps) {
  // Obter o slot correto para um dia e indice
  const getSlotForDay = (index: number, dia: DiaSemana): HorarioSlot => {
    // Sexta-feira (5) vespertino tem horarios diferentes
    if (dia === 5 && isVespertino && sextaVespertinoSlots && sextaVespertinoSlots[index]) {
      return sextaVespertinoSlots[index];
    }
    return timeSlots[index];
  };

  // Buscar horario no banco usando os horarios corretos do dia
  const getHorarioAt = (index: number, dia: DiaSemana) => {
    const slot = getSlotForDay(index, dia);
    return horarios.find(
      h => h.horaInicio === slot.horaInicio && h.horaFim === slot.horaFim && h.diaSemana === dia
    ) || null;
  };

  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: 600 }}>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                width: 80,
                bgcolor: 'background.default',
                borderBottom: 2,
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Tempo
              </Typography>
            </TableCell>
            {DIAS_SEMANA.map(dia => (
              <TableCell
                key={dia}
                align="center"
                sx={{
                  bgcolor: 'background.default',
                  borderBottom: 2,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  {DiasSemanaNomesAbrev[dia]}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {timeSlots.map((slot, index) => (
            <TableRow key={`tempo-${index}`}>
              <TableCell
                sx={{
                  bgcolor: 'background.default',
                  borderRight: 1,
                  borderColor: 'divider',
                  py: 1,
                }}
              >
                <Typography variant="caption" fontWeight={600} display="block">
                  {slot.label}
                </Typography>
              </TableCell>
              {DIAS_SEMANA.map(dia => {
                const daySlot = getSlotForDay(index, dia);
                const horario = getHorarioAt(index, dia);
                const turma = horario ? turmas.find(t => t.id === horario.turmaId) : undefined;
                const disciplina = horario ? disciplinas.find(d => d.id === horario.disciplinaId) : undefined;
                const professor = horario ? professores.find(p => p.id === horario.professorId) : undefined;

                return (
                  <TableCell
                    key={dia}
                    sx={{
                      p: 0.5,
                      verticalAlign: 'top',
                      minWidth: 100,
                    }}
                  >
                    <Box sx={{ mb: 0.25 }}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                        {daySlot.horaInicio}-{daySlot.horaFim}
                      </Typography>
                    </Box>
                    <HorarioCell
                      horario={horario}
                      turma={viewMode === 'professor' ? turma : undefined}
                      disciplina={disciplina}
                      professor={viewMode === 'turma' ? professor : undefined}
                      canEdit={canEdit}
                      onClick={() => onCellClick(horario || undefined, { dia, slot: daySlot })}
                    />
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
