/**
 * Firebase Cloud Functions para SGE.
 *
 * sendHorarioNotifications: Executa a cada minuto para verificar
 * se e hora de enviar notificacoes de proximo horario.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

admin.initializeApp();

// URL base da aplicacao (configurar no Firebase Functions config)
const getAppUrl = (): string => {
  return functions.config().app?.url || process.env.APP_URL || 'http://localhost:3000';
};

// Secret para autenticacao
const getCronSecret = (): string => {
  return functions.config().cron?.secret || process.env.CRON_SECRET || '';
};

/**
 * Funcao agendada para enviar notificacoes de horarios.
 * Executa a cada minuto durante horario escolar (07:00 - 18:30).
 *
 * Configurar timezone para America/Sao_Paulo.
 */
export const sendHorarioNotifications = functions
  .region('southamerica-east1')
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
  })
  .pubsub.schedule('* 7-18 * * 1-5') // A cada minuto, 7h-18h, Seg-Sex
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    const appUrl = getAppUrl();
    const cronSecret = getCronSecret();

    console.log(`[sendHorarioNotifications] Running at ${context.timestamp}`);
    console.log(`[sendHorarioNotifications] App URL: ${appUrl}`);

    try {
      const response = await fetch(`${appUrl}/api/horarios/send-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      console.log('[sendHorarioNotifications] Response:', JSON.stringify(data));

      if (!response.ok) {
        console.error(`[sendHorarioNotifications] API error: ${response.status}`, data);
      }

      return null;
    } catch (error) {
      console.error('[sendHorarioNotifications] Error:', error);
      return null;
    }
  });

/**
 * Funcao HTTP para teste manual.
 * GET /testNotifications?testTime=07:45&testDay=1
 */
export const testHorarioNotifications = functions
  .region('southamerica-east1')
  .https.onRequest(async (req, res) => {
    const appUrl = getAppUrl();
    const cronSecret = getCronSecret();
    const testTime = req.query.testTime as string | undefined;
    const testDay = req.query.testDay ? parseInt(req.query.testDay as string) : undefined;

    console.log(`[testHorarioNotifications] Testing with time=${testTime}, day=${testDay}`);

    try {
      const response = await fetch(`${appUrl}/api/horarios/send-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ testTime, testDay }),
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('[testHorarioNotifications] Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
