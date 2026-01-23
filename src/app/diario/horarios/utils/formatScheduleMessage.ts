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

// Emojis para turnos
const TURNO_EMOJI = {
  matutino: '🌅',
  vespertino: '🌇',
};

interface FormatOptions {
  professorName: string;
  horarios: HorarioAula[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  dia?: DiaSemana; // Se especificado, formata apenas para um dia
  includeHeader?: boolean;
  includeFooter?: boolean;
}

/**
 * Formata o horario semanal de forma elegante para WhatsApp.
 */
export function formatWeeklySchedule({
  professorName,
  horarios,
  turmas,
  disciplinas,
  dia,
  includeHeader = true,
  includeFooter = true,
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

  // Construir mensagem
  const lines: string[] = [];

  // Header
  if (includeHeader) {
    lines.push('╔══════════════════════════╗');
    if (dia !== undefined) {
      lines.push(`║   📅 *HORÁRIO DE ${DiasSemanaNomes[dia].toUpperCase()}*`);
    } else {
      lines.push('║   📅 *HORÁRIO SEMANAL*');
    }
    lines.push('╚══════════════════════════╝');
    lines.push('');
    lines.push(`Olá *${firstName}*! ${dia !== undefined ? 'Segue seu horário:' : 'Segue sua grade semanal:'}`);
    lines.push('');
  }

  // Dias da semana
  Object.entries(byDay)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([diaNum, horariosDia]) => {
      const diaKey = Number(diaNum) as DiaSemana;
      const emoji = DAY_EMOJIS[diaKey];

      lines.push(`${emoji} *${DiasSemanaNomes[diaKey]}*`);
      lines.push('─────────────────────');

      // Ordenar por horario
      horariosDia
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
        .forEach(h => {
          const turma = turmasMap.get(h.turmaId);
          const disciplina = disciplinasMap.get(h.disciplinaId);

          const turnoEmoji = h.horaInicio < '12:00' ? TURNO_EMOJI.matutino : TURNO_EMOJI.vespertino;
          const horario = `${h.horaInicio}-${h.horaFim}`;
          const disciplinaNome = disciplina?.nome || 'N/A';
          const turmaNome = turma?.nome || 'N/A';

          // Formato: ⏰ 07:00-07:45
          lines.push(`${turnoEmoji} \`${horario}\``);
          lines.push(`   📚 ${disciplinaNome}`);
          lines.push(`   🎓 ${turmaNome}`);
          if (h.sala) {
            lines.push(`   📍 Sala ${h.sala}`);
          }
          lines.push('');
        });
    });

  // Footer
  if (includeFooter) {
    lines.push('─────────────────────');
    lines.push('_SGE Diário Digital_');
    lines.push('_Christ Master School_');
  }

  return lines.join('\n');
}

/**
 * Formata a notificacao do proximo tempo de forma elegante.
 */
export function formatNextClassNotification({
  professorName,
  horarios,
  turmas,
  disciplinas,
  nextStartTime,
}: {
  professorName: string;
  horarios: HorarioAula[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  nextStartTime: string;
}): string {
  const firstName = professorName.split(' ')[0];
  const turmasMap = new Map(turmas.map(t => [t.id, t]));
  const disciplinasMap = new Map(disciplinas.map(d => [d.id, d]));

  const lines: string[] = [];

  // Header
  lines.push('🔔 *PRÓXIMO TEMPO*');
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`Olá *${firstName}*!`);
  lines.push('');
  lines.push(`⏰ Horário: *${nextStartTime}*`);
  lines.push('');

  if (horarios.length === 1) {
    const h = horarios[0];
    const turma = turmasMap.get(h.turmaId);
    const disciplina = disciplinasMap.get(h.disciplinaId);

    lines.push('📚 *Sua próxima aula:*');
    lines.push('');
    lines.push(`   • Disciplina: *${disciplina?.nome || 'N/A'}*`);
    lines.push(`   • Turma: *${turma?.nome || 'N/A'}*`);
    if (h.sala) {
      lines.push(`   • Sala: *${h.sala}*`);
    }
  } else {
    lines.push('📚 *Suas próximas aulas:*');
    lines.push('');

    horarios.forEach((h, index) => {
      const turma = turmasMap.get(h.turmaId);
      const disciplina = disciplinasMap.get(h.disciplinaId);

      lines.push(`${index + 1}️⃣ *${disciplina?.nome || 'N/A'}*`);
      lines.push(`   🎓 ${turma?.nome || 'N/A'}`);
      if (h.sala) {
        lines.push(`   📍 Sala ${h.sala}`);
      }
      lines.push('');
    });
  }

  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('_SGE Diário Digital_');

  return lines.join('\n');
}

/**
 * Formata mensagem de teste.
 */
export function formatTestMessage(professorName: string): string {
  const firstName = professorName.split(' ')[0];

  return [
    '╔══════════════════════════╗',
    '║   🔔 *TESTE DE SISTEMA*',
    '╚══════════════════════════╝',
    '',
    `Olá *${firstName}*!`,
    '',
    'Este é um teste do sistema de notificações de horários.',
    '',
    '✅ Se você recebeu esta mensagem, o sistema está funcionando corretamente!',
    '',
    '━━━━━━━━━━━━━━━━━━',
    '_SGE Diário Digital_',
    '_Christ Master School_',
  ].join('\n');
}
