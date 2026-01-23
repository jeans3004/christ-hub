/**
 * Utilitarios para formatacao de mensagens de horarios para WhatsApp.
 */

import { HorarioAula, Turma, Disciplina, DiaSemana, DiasSemanaNomes } from '@/types';

// Emojis para dias da semana
const DAY_EMOJIS: Record<DiaSemana, string> = {
  0: '☀️',
  1: '🔵',
  2: '🟢',
  3: '🟡',
  4: '🟠',
  5: '🔴',
  6: '☀️',
};

interface FormatOptions {
  professorName: string;
  horarios: HorarioAula[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  dia?: DiaSemana;
}

/**
 * Formata o horario semanal de forma compacta e elegante para WhatsApp.
 */
export function formatWeeklySchedule({
  professorName,
  horarios,
  turmas,
  disciplinas,
  dia,
}: FormatOptions): string {
  const firstName = professorName.split(' ')[0];

  // Filtrar horarios por dia se especificado
  const horariosToFormat = dia !== undefined
    ? horarios.filter(h => h.diaSemana === dia)
    : horarios;

  if (horariosToFormat.length === 0) {
    return `Olá ${firstName}, não há horários cadastrados${dia !== undefined ? ` para ${DiasSemanaNomes[dia]}` : ''}.`;
  }

  // Agrupar por dia
  const byDay = horariosToFormat.reduce((acc, h) => {
    if (!acc[h.diaSemana]) acc[h.diaSemana] = [];
    acc[h.diaSemana].push(h);
    return acc;
  }, {} as Record<number, HorarioAula[]>);

  // Criar mapas para lookup rapido
  const turmasMap = new Map(turmas.map(t => [t.id, t]));
  const disciplinasMap = new Map(disciplinas.map(d => [d.id, d]));

  const lines: string[] = [];

  // Header compacto
  lines.push('📅 *HORÁRIO SEMANAL*');
  lines.push(`Olá *${firstName}*!`);
  lines.push('');

  // Dias da semana - formato compacto em tabela
  Object.entries(byDay)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([diaNum, horariosDia]) => {
      const diaKey = Number(diaNum) as DiaSemana;
      const emoji = DAY_EMOJIS[diaKey];

      lines.push(`${emoji} *${DiasSemanaNomes[diaKey]}*`);

      // Ordenar por horario e formatar em linhas compactas
      horariosDia
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
        .forEach(h => {
          const turma = turmasMap.get(h.turmaId);
          const disciplina = disciplinasMap.get(h.disciplinaId);

          const horario = h.horaInicio.substring(0, 5);
          const disc = (disciplina?.nome || 'N/A').substring(0, 12);
          const turmaName = turma?.nome || 'N/A';
          const sala = h.sala ? ` 📍${h.sala}` : '';

          // Formato compacto: 07:00 │ Matemática │ 6ºA │ S.101
          lines.push(`\`${horario}\` ${disc} • *${turmaName}*${sala}`);
        });

      lines.push('');
    });

  // Footer
  lines.push('_Christ Master School_');

  return lines.join('\n');
}

/**
 * Formata mensagem de teste.
 */
export function formatTestMessage(professorName: string): string {
  const firstName = professorName.split(' ')[0];

  return [
    '🔔 *TESTE DO SISTEMA*',
    '',
    `Olá *${firstName}*!`,
    '',
    'Este é um teste do sistema de notificações.',
    '',
    '✅ Sistema funcionando!',
    '',
    '_Christ Master School_',
  ].join('\n');
}
