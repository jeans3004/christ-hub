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
import { DiaSemana, DiasSemanaNomes, HorarioAula, Turma, Disciplina, Usuario } from '@/types';

// Mapeamento de horário inicial para número do tempo
const TEMPO_MAP: Record<string, number> = {
  // Matutino
  '07:00': 1, '07:45': 2, '08:30': 3, '09:15': 4, '10:00': 5, '10:45': 6, '11:30': 7,
  // Vespertino
  '13:00': 1, '13:45': 2, '14:30': 3, '15:15': 4, '16:00': 5, '16:45': 6, '17:30': 7,
  // Sexta Vespertino (horários diferentes)
  '13:35': 2, '14:10': 3, '14:45': 4, '15:20': 5, '15:55': 6, '16:30': 7,
};

function getTempoNumber(horaInicio: string): string {
  const tempo = TEMPO_MAP[horaInicio];
  return tempo ? `${tempo}º` : '';
}

/**
 * Formata mensagem de teste.
 */
function formatTestMessage(professorName: string): string {
  const firstName = professorName?.split(' ')[0] || 'Professor';
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
    '_Sistema Automático_',
    '_Centro de Educação Integral Christ Master_',
  ].join('\n');
}

interface ReplacementInfo {
  turmaId: string;
  turmaNome: string;
  nextProfessorName: string | null;
}

/**
 * Formata notificacao do proximo tempo com info de quem assume a turma anterior.
 */
function formatNextClassNotification(
  professorName: string,
  nextClasses: HorarioAula[],
  turmasMap: Map<string, Turma>,
  disciplinasMap: Map<string, Disciplina>,
  nextStartTime: string,
  replacements: ReplacementInfo[]
): string {
  const firstName = professorName?.split(' ')[0] || 'Professor';

  const lines: string[] = [];

  // Verificar se todas as aulas são da mesma disciplina
  const disciplinaIds = [...new Set(nextClasses.map(h => h.disciplinaId))];
  const sameDiscipline = disciplinaIds.length === 1;
  const disciplinaUnica = sameDiscipline ? disciplinasMap.get(disciplinaIds[0]) : null;

  // Header compacto
  if (sameDiscipline && disciplinaUnica) {
    lines.push(`🔔 *PRÓXIMO TEMPO* - ${disciplinaUnica.nome}`);
  } else {
    lines.push('🔔 *PRÓXIMO TEMPO*');
  }
  lines.push(`Olá *${firstName}*!`);
  lines.push('');

  // Proximas aulas
  lines.push('📚 *Você vai para:*');
  nextClasses.forEach(h => {
    const turma = turmasMap.get(h.turmaId);
    const disciplina = disciplinasMap.get(h.disciplinaId);
    const sala = h.sala ? ` 📍${h.sala}` : '';
    const tempo = getTempoNumber(h.horaInicio);

    if (sameDiscipline) {
      lines.push(`  *${tempo}* - \`${h.horaInicio}\` às \`${h.horaFim}\` *${turma?.nome || 'N/A'}*${sala}`);
    } else {
      lines.push(`  *${tempo}* - \`${h.horaInicio}\` às \`${h.horaFim}\` ${disciplina?.nome || 'N/A'} • *${turma?.nome || 'N/A'}*${sala}`);
    }
  });

  // Info de quem assume as turmas anteriores
  if (replacements.length > 0) {
    lines.push('');
    lines.push('🔄 *Quem assume sua turma:*');
    replacements.forEach(r => {
      if (r.nextProfessorName) {
        lines.push(`  ${r.turmaNome} → *${r.nextProfessorName}*`);
      } else {
        lines.push(`  ${r.turmaNome} → _sem professor_`);
      }
    });
  }

  lines.push('');
  lines.push('─────────────────');
  lines.push('_Sistema Automático_');
  lines.push('_Centro de Educação Integral Christ Master_');

  return lines.join('\n');
}

// Feriados: datas em que NAO enviar notificacoes de aula.
// No primeiro horario (07:45) do primeiro dia de cada bloco, envia mensagem de feriado.
const FERIADOS: Array<{ data: string; mensagem?: string; enviarEm?: string }> = [
  // Carnaval 2026
  { data: '2026-02-16', mensagem: '🎭 *FERIADO - CARNAVAL*\n\nOlá *{{nome}}*!\n\nAproveite o feriado, ótimo Carnaval! 🎉\n\nAs aulas retornam na *quinta-feira (19/02)*.\n\n─────────────────\n_Centro de Educação Integral Christ Master_', enviarEm: '07:45' },
  { data: '2026-02-17' },
  { data: '2026-02-18' },
];

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

    // Verificar feriado
    const dateStr = `${brasilTime.getFullYear()}-${String(brasilTime.getMonth() + 1).padStart(2, '0')}-${String(brasilTime.getDate()).padStart(2, '0')}`;
    const feriado = FERIADOS.find(f => f.data === dateStr);

    if (feriado) {
      // Se tem mensagem para enviar neste horario, envia para todos os professores
      if (feriado.mensagem && feriado.enviarEm && timeToCheck === feriado.enviarEm) {
        console.log(`[Horarios Notification] Feriado ${dateStr} - enviando mensagem de feriado`);
        const allUsuarios = await usuarioService.getAll();
        const professores = allUsuarios.filter(u => u.celular && u.ativo);

        const results: NotificationResult[] = [];
        for (const professor of professores) {
          const firstName = professor.nome?.split(' ')[0] || 'Professor';
          const msg = feriado.mensagem.replace('{{nome}}', firstName);
          try {
            const result = await whatsappService.sendText(professor.celular!, msg);
            results.push({ professorId: professor.id, professorNome: professor.nome, success: result.success, error: result.error });
          } catch (error) {
            results.push({ professorId: professor.id, professorNome: professor.nome, success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' });
          }
        }

        const successCount = results.filter(r => r.success).length;
        return NextResponse.json({
          success: true,
          message: `Feriado - mensagem enviada: ${successCount}/${results.length} professores`,
          notifications: results,
        });
      }

      // Feriado sem mensagem para enviar agora - pular
      return NextResponse.json({
        success: true,
        message: `Feriado (${dateStr}) - sem notificacoes de aula`,
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

    // Buscar horarios que estao terminando agora (turmas que os professores estao saindo)
    const endingHorarios = allHorarios.filter(
      h => h.diaSemana === dayToCheck && h.horaFim === timeToCheck
    );

    // Mapear: professor -> turmas que ele esta saindo
    const professorLeavingTurmas = new Map<string, string[]>();
    for (const h of endingHorarios) {
      const existing = professorLeavingTurmas.get(h.professorId) || [];
      existing.push(h.turmaId);
      professorLeavingTurmas.set(h.professorId, existing);
    }

    // Mapear: turma -> proximo professor (no proximo slot)
    const nextProfessorByTurma = new Map<string, string>();
    for (const h of horarios) {
      nextProfessorByTurma.set(h.turmaId, h.professorId);
    }

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

      // Buscar turmas que o professor esta saindo e quem vai assumir
      const leavingTurmas = professorLeavingTurmas.get(professorId) || [];
      const replacements: ReplacementInfo[] = leavingTurmas.map(turmaId => {
        const turma = turmasMap.get(turmaId);
        const nextProfId = nextProfessorByTurma.get(turmaId);
        const nextProf = nextProfId ? professoresMap.get(nextProfId) : null;

        return {
          turmaId,
          turmaNome: turma?.nome || 'Turma desconhecida',
          nextProfessorName: nextProf?.nome?.split(' ')[0] || null,
        };
      });

      // Montar mensagem formatada
      const mensagem = formatNextClassNotification(
        professor.nome,
        profHorarios,
        turmasMap,
        disciplinasMap,
        nextStartTime,
        replacements
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
