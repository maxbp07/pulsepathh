/**
 * Web Push (VAPID) — envío y limpieza de suscripciones expiradas.
 */
import webpush from 'web-push';
import { prisma } from './prisma.js';
import { config } from '../config/env.js';


let configured = false;

export function isPushConfigured() {
  return Boolean(config.vapidPublicKey && config.vapidPrivateKey && config.vapidSubject);
}

export function ensurePushConfigured() {
  if (!isPushConfigured()) {
    throw new Error('VAPID keys not configured. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.');
  }
  if (!configured) {
    webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey);
    configured = true;
  }
}

export function getVapidPublicKey() {
  return config.vapidPublicKey ?? null;
}

export async function sendPushToSubscription(subscription, payload) {
  ensurePushConfigured();
  const body = JSON.stringify(payload);
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      body,
    );
    return { ok: true };
  } catch (err) {
    const status = err?.statusCode;
    if (status === 404 || status === 410) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: subscription.endpoint },
      });
      return { ok: false, expired: true };
    }
    return { ok: false, error: err?.message ?? 'push failed' };
  }
}

export async function sendPushToCodeHash(codeHash, payload) {
  const subs = await prisma.pushSubscription.findMany({ where: { codeHash } });
  const results = [];
  for (const sub of subs) {
    results.push(await sendPushToSubscription(sub, payload));
  }
  return results;
}
