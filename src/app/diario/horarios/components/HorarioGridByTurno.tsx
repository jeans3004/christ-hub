/**
 * Grade de horarios por turno (Matutino/Vespertino).
 * Colunas: Turmas do turno
 * Linhas: Dias x Tempos (7 tempos por dia, 5 dias = 35 linhas)
 */

import { Fragment } from 'react';
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
  alpha,
  useTheme,
} from '@mui/material';
import { DiaSemana, HorarioAula, Turma, Disciplina, Usuario, HorarioSlot } from '@/types';

const DIAS_NOMES: Record<number, string> = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
};

const DIAS_SEMANA: DiaSemana[] = [1, 2, 3, 4, 5]; // Segunda a Sexta

// Paleta expandida — 20 matizes distintos (mesma do HorarioCell)
const DISCIPLINA_COLORS = [
  '#2563EB', '#059669', '#DC2626', '#7C3AED',
  '#EA580C', '#0891B2', '#DB2777', '#65A30D',
  '#CA8A04', '#4F46E5', '#0D9488', '#E11D48',
  '#9333EA', '#C2410C', '#0284C7', '#16A34A',
  '#A21CAF', '#B45309', '#6D28D9', '#BE185D',
];

function getColorForDisciplina(nome: string): string {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DISCIPLINA_COLORS[Math.abs(hash) % DISCIPLINA_COLORS.length];
}

// Converte horario HH:MM para minutos desde meia-noite
const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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

  // Buscar horario cujo ponto medio cai dentro do slot
  const getHorario = (turmaId: string, dia: DiaSemana, slot: HorarioSlot) => {
    const slotStart = timeToMinutes(slot.horaInicio);
    const slotEnd = timeToMinutes(slot.horaFim);

    return horarios.find(h => {
      if (h.turmaId !== turmaId || h.diaSemana !== dia) return false;

      const hStart = timeToMinutes(h.horaInicio);
      const hEnd = timeToMinutes(h.horaFim);
      // Ponto medio do horario
      const midpoint = (hStart + hEnd) / 2;

      // Horario pertence ao slot onde seu ponto medio esta
      return midpoint >= slotStart && midpoint < slotEnd;
    }) || null;
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
    <TableContainer
      component={Paper}
      sx={{
        maxHeight: 'calc(100vh - 300px)',
        overflowX: 'auto',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        '&::-webkit-scrollbar': {
          height: 8,
          width: 8,
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
      <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
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
                  minWidth: 130,
                  bgcolor: isDark ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.06),
                  borderBottom: 2,
                  borderColor: 'primary.main',
                }}
              >
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.75rem', color: 'text.primary' }}>
                  {turma.nome}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <Fragment key={`${row.dia}-${row.slotIndex}`}>
              {/* Header do dia — linha separadora com nome completo */}
              {row.isFirstOfDay && (
                <TableRow>
                  <TableCell
                    colSpan={turmasFiltradas.length + 1}
                    sx={{
                      bgcolor: isDark ? alpha(theme.palette.primary.main, 0.18) : alpha(theme.palette.primary.main, 0.08),
                      borderTop: 3,
                      borderBottom: 1,
                      borderColor: 'primary.main',
                      py: 0.75,
                      px: 1.5,
                    }}
                  >
                    <Typography fontWeight={700} sx={{ fontSize: '0.82rem', color: 'primary.main', letterSpacing: 0.5 }}>
                      {DIAS_NOMES[row.dia]}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {/* Linha do tempo */}
              <TableRow>
                <TableCell
                  sx={{
                    bgcolor: 'background.default',
                    color: 'text.primary',
                    borderRight: 1,
                    borderColor: 'divider',
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    py: 0.5,
                    pl: 1.5,
                  }}
                >
                  <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.72rem' }}>
                    {row.slot.label}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.58rem', color: 'text.disabled', ml: 0.5 }}>
                    {row.slot.horaInicio}
                  </Typography>
                </TableCell>

                {turmasFiltradas.map(turma => {
                  const horario = getHorario(turma.id, row.dia, row.slot);
                  const disciplina = horario ? disciplinas.find(d => d.id === horario.disciplinaId) : null;
                  const professorNames = horario
                    ? (horario.professorIds && horario.professorIds.length > 0
                        ? horario.professorIds.map(id => professores.find(p => p.id === id)?.nome?.split(' ')[0] || '?').join(', ')
                        : professores.find(p => p.id === horario.professorId)?.nome?.split(' ')[0] || '?')
                    : null;

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
                      {horario ? (() => {
                        const discColor = disciplina
                          ? getColorForDisciplina(disciplina.nome)
                          : theme.palette.grey[500];
                        const hasConflict = horario.temConflito;
                        const cellColor = hasConflict ? theme.palette.warning.main : discColor;

                        return (
                          <Box
                            sx={{
                              bgcolor: alpha(cellColor, isDark ? 0.32 : 0.22),
                              borderLeft: `4px solid ${cellColor}`,
                              borderRadius: 1,
                              p: 0.5,
                              minHeight: 36,
                              position: 'relative',
                              transition: 'background-color 0.15s',
                              '&:hover': {
                                bgcolor: alpha(cellColor, isDark ? 0.45 : 0.35),
                              },
                              ...(hasConflict && {
                                border: '1.5px dashed',
                                borderColor: theme.palette.warning.main,
                                borderLeftWidth: 4,
                                borderLeftStyle: 'solid',
                              }),
                            }}
                            title={hasConflict ? 'Professor com duplicidade neste horario' : undefined}
                          >
                            {hasConflict && (
                              <Typography
                                component="span"
                                sx={{
                                  position: 'absolute',
                                  top: 1,
                                  right: 3,
                                  fontSize: '0.65rem',
                                }}
                              >
                                ⚠
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                display: 'block',
                                lineHeight: 1.2,
                                color: cellColor,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {disciplina?.nome?.substring(0, 18) || '?'}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.62rem',
                                display: 'block',
                                lineHeight: 1.15,
                                color: 'text.secondary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {professorNames}
                            </Typography>
                            {horario.sala && (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.58rem',
                                  display: 'block',
                                  lineHeight: 1.1,
                                  color: 'text.disabled',
                                }}
                              >
                                {horario.sala}
                              </Typography>
                            )}
                          </Box>
                        );
                      })() : (
                        <Box
                          sx={{
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1,
                            border: `1px dashed ${alpha(theme.palette.divider, 0.4)}`,
                          }}
                        >
                          {canEdit && (
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                              +
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
