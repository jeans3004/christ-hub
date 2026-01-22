/**
 * API Route: Enviar notificacoes automaticas de horarios via WhatsApp.
 * POST /api/horarios/send-notifications
 *
 * Chamado por Cloud Function no final de cada tempo para notificar
 * professores sobre sua proxima aula.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { whatsappService } from '@/services/whatsappService';
import { HorarioAula, DiaSemana, DiasSemanaNomes } from '@/types';

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
    const currentDay = brasilTime.getDay() as DiaSemana; // 0=Dom, 1=Seg, ..., 5=Sex, 6=Sab
    const currentYear = brasilTime.getFullYear();

    // Permitir override para testes (via body ou query params)
    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    const testTime = (url.searchParams.get('testTime') || body.testTime) as string | undefined;
    const testDay = url.searchParams.get('testDay')
      ? parseInt(url.searchParams.get('testDay')!) as DiaSemana
      : body.testDay as DiaSemana | undefined;
    const timeToCheck = testTime || currentTime;
    const dayToCheck = testDay !== undefined ? testDay : currentDay;

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
        // Pegar o inicio do proximo tempo (que e o fim atual)
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

    // Buscar horarios do proximo tempo
    const horariosSnapshot = await adminDb
      .collection('horarios')
      .where('ano', '==', currentYear)
      .where('diaSemana', '==', dayToCheck)
      .where('horaInicio', '==', nextStartTime)
      .where('ativo', '==', true)
      .get();

    if (horariosSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum horario encontrado para o proximo tempo',
        notifications: [],
      });
    }

    const horarios = horariosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as HorarioAula[];

    console.log(`[Horarios Notification] Found ${horarios.length} schedules for next slot`);

    // Agrupar por professor
    const horariosByProfessor = new Map<string, HorarioAula[]>();
    for (const h of horarios) {
      const existing = horariosByProfessor.get(h.professorId) || [];
      existing.push(h);
      horariosByProfessor.set(h.professorId, existing);
    }

    // Buscar dados dos professores, turmas e disciplinas
    const professorIds = Array.from(horariosByProfessor.keys());
    const turmaIds = [...new Set(horarios.map(h => h.turmaId))];
    const disciplinaIds = [...new Set(horarios.map(h => h.disciplinaId))];

    const [professoresSnapshot, turmasSnapshot, disciplinasSnapshot] = await Promise.all([
      adminDb.collection('usuarios').where('__name__', 'in', professorIds.slice(0, 10)).get(),
      adminDb.collection('turmas').where('__name__', 'in', turmaIds.slice(0, 10)).get(),
      adminDb.collection('disciplinas').where('__name__', 'in', disciplinaIds.slice(0, 10)).get(),
    ]);

    const professores = new Map(professoresSnapshot.docs.map(doc => [doc.id, doc.data()]));
    const turmas = new Map(turmasSnapshot.docs.map(doc => [doc.id, doc.data()]));
    const disciplinas = new Map(disciplinasSnapshot.docs.map(doc => [doc.id, doc.data()]));

    // Enviar notificacoes
    const results: NotificationResult[] = [];

    for (const [professorId, profHorarios] of horariosByProfessor) {
      const professor = professores.get(professorId);
      if (!professor) {
        results.push({
          professorId,
          professorNome: 'Desconhecido',
          success: false,
          error: 'Professor nao encontrado',
        });
        continue;
      }

      const celular = professor.celular as string;
      if (!celular) {
        results.push({
          professorId,
          professorNome: professor.nome as string,
          success: false,
          error: 'Professor sem celular cadastrado',
        });
        continue;
      }

      // Montar mensagem
      const aulaInfo = profHorarios.map(h => {
        const turma = turmas.get(h.turmaId);
        const disciplina = disciplinas.get(h.disciplinaId);
        const turmaNome = turma?.nome || 'Turma desconhecida';
        const disciplinaNome = disciplina?.nome || 'Disciplina desconhecida';
        const salaInfo = h.sala ? ` (${h.sala})` : '';
        return `• ${disciplinaNome} - ${turmaNome}${salaInfo}`;
      }).join('\n');

      const mensagem = `📚 *Próximo tempo*\n\nOlá ${professor.nome?.split(' ')[0]}, sua próxima aula:\n\n${aulaInfo}\n\n⏰ ${nextStartTime}`;

      try {
        const result = await whatsappService.sendText(celular, mensagem);
        results.push({
          professorId,
          professorNome: professor.nome as string,
          success: result.success,
          error: result.error,
        });
      } catch (error) {
        results.push({
          professorId,
          professorNome: professor.nome as string,
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
