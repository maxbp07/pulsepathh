import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const encryptionKey = process.env.ENCRYPTION_KEY;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is required. Set it in your .env file (see .env.example).');
}

if (!encryptionKey) {
  throw new Error('ENCRYPTION_KEY is required. Set it in your .env file (see .env.example).');
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret,
  encryptionKey,
  adminSecret: process.env.ADMIN_SECRET,
  cronSecret: process.env.CRON_SECRET ?? null,
  nodeEnv: process.env.NODE_ENV || 'development',
  isServerless: Boolean(process.env.VERCEL),
  disablePdf:
    process.env.DISABLE_PDF === '1' ||
    process.env.DISABLE_PDF === 'true' ||
    Boolean(process.env.VERCEL),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? null,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? null,
  vapidSubject: process.env.VAPID_SUBJECT ?? 'mailto:ops@study.pulsepath.local',
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL ?? null,
  gitSha: process.env.GIT_SHA ?? 'dev',
};
