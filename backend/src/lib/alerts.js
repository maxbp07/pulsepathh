import { config } from '../config/env.js';
import { logger } from './logger.js';

export async function sendAlert(kind, payload = {}) {
  const body = { kind, ts: new Date().toISOString(), ...payload };
  logger.warn('alert', body);
  if (!config.alertWebhookUrl) return;
  try {
    await fetch(config.alertWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    logger.error('alert_webhook_failed', { message: err?.message });
  }
}
