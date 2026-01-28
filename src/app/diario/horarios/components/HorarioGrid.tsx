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

// Converte horario HH:MM para minutos desde meia-noite
const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Calcula sobreposicao em minutos entre dois intervalos
const getOverlap = (start1: number, end1: number, start2: number, end2: number): number => {
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  return Math.max(0, overlapEnd - overlapStart);
};

export function HorarioGrid({
  horarios,
  turmas,
  disciplinas,
  professores,
  timeSlots,
  sextaVespertinoSlots,
  isVespertino,
  canEdit,
  canAddPessoal,
  onCellClick,
  onAddPessoal,
  viewMode,
}: HorarioGridProps) {
  // Obter o slot correto para um dia e indice
  const getSlotForDay = (index: number, dia: DiaSemana): HorarioSlot => {
    const slot = timeSlots[index];

    // Sexta-feira (5) vespertino tem horarios de 35 minutos
    // Verificar se o slot é vespertino baseado no horário (>= 13:00)
    if (dia === 5 && sextaVespertinoSlots) {
      const hora = parseInt(slot.horaInicio.split(':')[0] || '0');
      if (hora >= 13) {
        // Calcular índice do slot vespertino (0-6)
        // Se timeSlots tem todos os 14 slots, vespertino começa no índice 7
        // Se timeSlots tem apenas 7 vespertino slots, o índice já está correto
        const vespertinoIndex = timeSlots.length > 7 ? index - 7 : index;
        if (sextaVespertinoSlots[vespertinoIndex]) {
          return sextaVespertinoSlots[vespertinoIndex];
        }
      }
    }

    return slot;
  };

  // Buscar horario cujo ponto medio cai dentro do slot
  const getHorarioAt = (index: number, dia: DiaSemana) => {
    const slot = getSlotForDay(index, dia);
    const slotStart = timeToMinutes(slot.horaInicio);
    const slotEnd = timeToMinutes(slot.horaFim);

    return horarios.find(h => {
      if (h.diaSemana !== dia) return false;

      const hStart = timeToMinutes(h.horaInicio);
      const hEnd = timeToMinutes(h.horaFim);
      // Ponto medio do horario
      const midpoint = (hStart + hEnd) / 2;

      // Horario pertence ao slot onde seu ponto medio esta
      return midpoint >= slotStart && midpoint < slotEnd;
    }) || null;
  };

  return (
    <TableContainer
      sx={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        '&::-webkit-scrollbar': {
          height: 8,
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'action.hover',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'primary.light',
          borderRadius: 4,
        },
      }}
    >
      <Table size="small" sx={{ minWidth: 600, tableLayout: 'fixed' }}>
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
                // Suporte a múltiplos professores
                const multipleProfessors = horario?.professorIds && horario.professorIds.length > 0
                  ? horario.professorIds.map(id => professores.find(p => p.id === id)).filter(Boolean) as typeof professores
                  : undefined;

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
                        {horario ? `${horario.horaInicio}-${horario.horaFim}` : `${daySlot.horaInicio}-${daySlot.horaFim}`}
                      </Typography>
                    </Box>
                    <HorarioCell
                      horario={horario}
                      turma={viewMode === 'professor' ? turma : undefined}
                      disciplina={disciplina}
                      professor={viewMode === 'turma' ? professor : undefined}
                      professors={viewMode === 'turma' ? multipleProfessors : undefined}
                      canEdit={canEdit}
                      canAddPessoal={canAddPessoal && !horario}
                      onClick={() => onCellClick(horario || undefined, { dia, slot: daySlot })}
                      onAddPessoal={() => onAddPessoal?.({ dia, slot: daySlot })}
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
