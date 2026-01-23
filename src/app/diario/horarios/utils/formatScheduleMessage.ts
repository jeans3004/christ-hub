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
  professorEmail?: string;
  horarios: HorarioAula[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  dia?: DiaSemana;
  senderName?: string;
  senderEmail?: string;
}

/**
 * Retorna o nome para exibir na assinatura.
 */
function getDisplayName(name: string, email?: string): string {
  if (email === 'suportecoord2@christmaster.com.br') {
    return 'Super Admin';
  }
  return name || 'Sistema';
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
  senderName,
  senderEmail,
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

  // Dias da semana
  Object.entries(byDay)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([diaNum, horariosDia]) => {
      const diaKey = Number(diaNum) as DiaSemana;
      const emoji = DAY_EMOJIS[diaKey];

      // Verificar se todas as aulas do dia sao da mesma disciplina
      const disciplinaIds = [...new Set(horariosDia.map(h => h.disciplinaId))];
      const sameDiscipline = disciplinaIds.length === 1;
      const disciplinaUnica = sameDiscipline ? disciplinasMap.get(disciplinaIds[0]) : null;

      // Titulo do dia (com disciplina se todas forem iguais)
      if (sameDiscipline && disciplinaUnica) {
        lines.push(`${emoji} *${DiasSemanaNomes[diaKey]}* - ${disciplinaUnica.nome}`);
      } else {
        lines.push(`${emoji} *${DiasSemanaNomes[diaKey]}*`);
      }

      // Ordenar por horario e formatar
      horariosDia
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
        .forEach(h => {
          const turma = turmasMap.get(h.turmaId);
          const disciplina = disciplinasMap.get(h.disciplinaId);

          const horario = `${h.horaInicio}-${h.horaFim}`;
          const turmaName = turma?.nome || 'N/A';
          const sala = h.sala ? ` 📍${h.sala}` : '';

          // Se todas disciplinas iguais, nao repetir o nome
          if (sameDiscipline) {
            lines.push(`  \`${horario}\` *${turmaName}*${sala}`);
          } else {
            const disc = disciplina?.nome || 'N/A';
            lines.push(`  \`${horario}\` ${disc} • *${turmaName}*${sala}`);
          }
        });

      lines.push('');
    });

  // Footer com assinatura
  lines.push('─────────────────');
  lines.push(`_${getDisplayName(senderName || '', senderEmail)}_`);
  lines.push('_Centro de Educação Integral Christ Master_');

  return lines.join('\n');
}

/**
 * Formata mensagem de teste.
 */
export function formatTestMessage(
  professorName: string,
  senderName?: string,
  senderEmail?: string
): string {
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
    '─────────────────',
    `_${getDisplayName(senderName || '', senderEmail)}_`,
    '_Centro de Educação Integral Christ Master_',
  ].join('\n');
}
