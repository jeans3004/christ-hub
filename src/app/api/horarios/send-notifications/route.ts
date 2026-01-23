/**
 * API Route: Enviar notificacoes automaticas de horarios via WhatsApp.
 * POST /api/horarios/send-notifications
 *
 * Chamado por cron job no final de cada tempo para notificar
 * professores sobre sua proxima aula.
 */

import { NextRequest, NextResponse } from 'next/server';
import { horarioService, usuarioService, turmaService, disciplinaService } from '@/services/firestore';
import { whatsappService } from '@/services/whatsappService';
import { DiaSemana, DiasSemanaNomes, HorarioAula, Turma, Disciplina } from '@/types';

// Emojis para turnos
const TURNO_EMOJI = {
  matutino: '🌅',
  vespertino: '🌇',
};

/**
 * Formata mensagem de teste elegante.
 */
function formatTestMessage(professorName: string): string {
  const firstName = professorName?.split(' ')[0] || 'Professor';
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

/**
 * Formata notificacao do proximo tempo.
 */
function formatNextClassNotification(
  professorName: string,
  horarios: HorarioAula[],
  turmasMap: Map<string, Turma>,
  disciplinasMap: Map<string, Disciplina>,
  nextStartTime: string
): string {
  const firstName = professorName?.split(' ')[0] || 'Professor';
  const turnoEmoji = nextStartTime < '12:00' ? TURNO_EMOJI.matutino : TURNO_EMOJI.vespertino;

  const lines: string[] = [];

  // Header
  lines.push('🔔 *PRÓXIMO TEMPO*');
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`Olá *${firstName}*!`);
  lines.push('');
  lines.push(`${turnoEmoji} Horário: *${nextStartTime}*`);
  lines.push('');

  if (horarios.length === 1) {
    const h = horarios[0];
    const turma = turmasMap.get(h.turmaId);
    const disciplina = disciplinasMap.get(h.disciplinaId);

    lines.push('📚 *Sua próxima aula:*');
    lines.push('');
    lines.push(`   📖 *${disciplina?.nome || 'N/A'}*`);
    lines.push(`   🎓 ${turma?.nome || 'N/A'}`);
    if (h.sala) {
      lines.push(`   📍 Sala ${h.sala}`);
    }
  } else {
    lines.push('📚 *Suas próximas aulas:*');
    lines.push('');

    horarios.forEach((h, index) => {
      const turma = turmasMap.get(h.turmaId);
      const disciplina = disciplinasMap.get(h.disciplinaId);
      const numEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][index] || '▪️';

      lines.push(`${numEmoji} *${disciplina?.nome || 'N/A'}*`);
      lines.push(`   🎓 ${turma?.nome || 'N/A'}`);
      if (h.sala) {
        lines.push(`   📍 Sala ${h.sala}`);
      }
      lines.push('');
    });
  }

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('_SGE Diário Digital_');

  return lines.join('\n');
}

// Horarios de fim de cada tempo (quando enviar notificacao)
const MATUTINO_END_TIMES = ['07:45', '08:30', '09:15', '10:00', '10:45', '11:30', '12:15'];
const VESPERTINO_END_TIMES = ['13:45', '14:30', '15:15', '16:00', '16:45', '17:30', '18:15'];
const SEXTA_VESPERTINO_END_TIMES = ['13:35', '14:10', '14:45', '15:20', '15:55', '16:30', '17:05'];

// Mapeamento de fim -> inicio do proximo tempo
const MATUTINO_NEXT_START: Record<string, string> = {
  '07:45': '07:45', '08:30': '08:30', '09:15': '09:15', '10:00': '10:00',
  '10:45': '10:45', '11:30': '11:30',
};
const VESPERTINO_NEXT_START: Record<string, string> = {
  '13:45': '13:45', '14:30': '14:30', '15:15': '15:15', '16:00': '16:00',
  '16:45': '16:45', '17:30': '17:30',
};
const SEXTA_VESPERTINO_NEXT_START: Record<string, string> = {
  '13:35': '13:35', '14:10': '14:10', '14:45': '14:45', '15:20': '15:20',
  '15:55': '15:55', '16:30': '16:30',
};

interface NotificationResult {
  professorId: string;
  professorNome: string;
  success: boolean;
  error?: string;
}

// Funcao para enviar teste para todos os professores
async function sendTestToAll() {
  try {
    const allUsuarios = await usuarioService.getAll();
    const professores = allUsuarios.filter(u => u.celular && u.ativo);

    const results: NotificationResult[] = [];

    for (const professor of professores) {
      const mensagem = formatTestMessage(professor.nome);

      try {
        const result = await whatsappService.sendText(professor.celular!, mensagem);
        results.push({
          professorId: professor.id,
          professorNome: professor.nome,
          success: result.success,
          error: result.error,
        });
      } catch (error) {
        results.push({
          professorId: professor.id,
          professorNome: professor.nome,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Teste enviado: ${successCount}/${results.length} professores`,
      notifications: results,
    });
  } catch (error) {
    console.error('[Test All] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

// Suportar GET para compatibilidade com servicos de cron
export async function GET(request: NextRequest) {
  return handleNotification(request);
}

export async function POST(request: NextRequest) {
  return handleNotification(request);
}

async function handleNotification(request: NextRequest) {
  try {
    // Verificar autenticacao (header ou query param para compatibilidade com cron-job.org)
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const querySecret = url.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorized = !cronSecret ||
      authHeader === `Bearer ${cronSecret}` ||
      querySecret === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obter hora atual no fuso de Brasilia
    const now = new Date();
    const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentHour = brasilTime.getHours().toString().padStart(2, '0');
    const currentMinute = brasilTime.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;
    const currentDay = brasilTime.getDay() as DiaSemana;
    const currentYear = brasilTime.getFullYear();

    // Permitir override para testes (via body ou query params)
    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    const testTime = (url.searchParams.get('testTime') || body.testTime) as string | undefined;
    const testDay = url.searchParams.get('testDay')
      ? parseInt(url.searchParams.get('testDay')!) as DiaSemana
      : body.testDay as DiaSemana | undefined;
    const testAll = url.searchParams.get('testAll') === 'true' || body.testAll === true;
    const timeToCheck = testTime || currentTime;
    const dayToCheck = testDay !== undefined ? testDay : currentDay;

    // Modo teste para todos os professores
    if (testAll) {
      return await sendTestToAll();
    }

    console.log(`[Horarios Notification] Checking time: ${timeToCheck}, day: ${dayToCheck} (${DiasSemanaNomes[dayToCheck]})`);

    // Verificar se e dia de aula (Segunda a Sexta)
    if (dayToCheck < 1 || dayToCheck > 5) {
      return NextResponse.json({
        success: true,
        message: 'Fim de semana - sem notificacoes',
        notifications: [],
      });
    }

    // Determinar qual lista de horarios usar
    let nextStartTime: string | null = null;

    // Verificar se e sexta vespertino (horarios diferentes)
    if (dayToCheck === 5 && SEXTA_VESPERTINO_END_TIMES.includes(timeToCheck)) {
      const index = SEXTA_VESPERTINO_END_TIMES.indexOf(timeToCheck);
      if (index < SEXTA_VESPERTINO_END_TIMES.length - 1) {
        nextStartTime = SEXTA_VESPERTINO_NEXT_START[timeToCheck];
      }
    } else if (MATUTINO_END_TIMES.includes(timeToCheck)) {
      const index = MATUTINO_END_TIMES.indexOf(timeToCheck);
      if (index < MATUTINO_END_TIMES.length - 1) {
        nextStartTime = MATUTINO_NEXT_START[timeToCheck];
      }
    } else if (VESPERTINO_END_TIMES.includes(timeToCheck)) {
      const index = VESPERTINO_END_TIMES.indexOf(timeToCheck);
      if (index < VESPERTINO_END_TIMES.length - 1) {
        nextStartTime = VESPERTINO_NEXT_START[timeToCheck];
      }
    }

    // Se nao e fim de tempo, nao fazer nada
    if (!nextStartTime) {
      return NextResponse.json({
        success: true,
        message: `Horario ${timeToCheck} nao e fim de tempo`,
        notifications: [],
      });
    }

    console.log(`[Horarios Notification] Next slot starts at: ${nextStartTime}`);

    // Buscar todos os horarios do ano e filtrar
    const allHorarios = await horarioService.getByAno(currentYear);
    const horarios = allHorarios.filter(
      h => h.diaSemana === dayToCheck && h.horaInicio === nextStartTime
    );

    if (horarios.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum horario encontrado para o proximo tempo',
        notifications: [],
      });
    }

    console.log(`[Horarios Notification] Found ${horarios.length} schedules for next slot`);

    // Buscar dados necessarios
    const [allProfessores, allTurmas, allDisciplinas] = await Promise.all([
      usuarioService.getAll(),
      turmaService.getAll(),
      disciplinaService.getAll(),
    ]);

    const professoresMap = new Map(allProfessores.map(p => [p.id, p]));
    const turmasMap = new Map(allTurmas.map(t => [t.id, t]));
    const disciplinasMap = new Map(allDisciplinas.map(d => [d.id, d]));

    // Agrupar por professor
    const horariosByProfessor = new Map<string, typeof horarios>();
    for (const h of horarios) {
      const existing = horariosByProfessor.get(h.professorId) || [];
      existing.push(h);
      horariosByProfessor.set(h.professorId, existing);
    }

    // Enviar notificacoes
    const results: NotificationResult[] = [];

    for (const [professorId, profHorarios] of horariosByProfessor) {
      const professor = professoresMap.get(professorId);
      if (!professor) {
        results.push({
          professorId,
          professorNome: 'Desconhecido',
          success: false,
          error: 'Professor nao encontrado',
        });
        continue;
      }

      const celular = professor.celular;
      if (!celular) {
        results.push({
          professorId,
          professorNome: professor.nome,
          success: false,
          error: 'Professor sem celular cadastrado',
        });
        continue;
      }

      // Montar mensagem formatada
      const mensagem = formatNextClassNotification(
        professor.nome,
        profHorarios,
        turmasMap,
        disciplinasMap,
        nextStartTime
      );

      try {
        const result = await whatsappService.sendText(celular, mensagem);
        results.push({
          professorId,
          professorNome: professor.nome,
          success: result.success,
          error: result.error,
        });
      } catch (error) {
        results.push({
          professorId,
          professorNome: professor.nome,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[Horarios Notification] Sent ${successCount}/${results.length} notifications`);

    return NextResponse.json({
      success: true,
      message: `Notificacoes enviadas: ${successCount}/${results.length}`,
      time: timeToCheck,
      day: DiasSemanaNomes[dayToCheck],
      nextSlot: nextStartTime,
      notifications: results,
    });
  } catch (error) {
    console.error('[Horarios Notification] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
