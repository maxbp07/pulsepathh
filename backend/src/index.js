import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { prisma } from './lib/prisma.js';
import { config } from './config/env.js';
import { logger, requestIdMiddleware } from './lib/logger.js';
import { sendAlert } from './lib/alerts.js';
import authRoutes from './routes/auth.routes.js';
import sessionRoutes from './routes/session.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import meRoutes from './routes/me.routes.js';
import checkinRoutes from './routes/checkin.routes.js';
import questionnaireRoutes from './routes/questionnaire.routes.js';
import pushRoutes from './routes/push.routes.js';
import opsRoutes from './routes/ops.routes.js';
import pushPublicRoutes from './routes/push-public.routes.js';
import adminRoutes from './routes/admin.routes.js';
import cronRoutes from './routes/cron.routes.js';
import { authLimiter, sessionLimiter, generalLimiter } from './middleware/rateLimit.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin) || config.nodeEnv !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('CORS blocked'));
      }
    },
    credentials: true,
  }),
);
app.use(requestIdMiddleware);
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'pulsepath-api',
    version: '1.0.0',
  });
});

app.get('/health', async (_req, res) => {
  const started = Date.now();
  let db = 'disconnected';
  let dbLatencyMs = null;

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    db = 'connected';
    dbLatencyMs = Date.now() - started;
  } catch {
    db = 'disconnected';
  }

  const status = db === 'connected' ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({
    status,
    db,
    dbLatencyMs,
    version: '2.0.0',
    gitSha: config.gitSha,
    pushConfigured: Boolean(config.vapidPublicKey && config.vapidPrivateKey),
    uptimeSec: Math.floor(process.uptime()),
    runtime: config.isServerless ? 'serverless' : 'node',
    pdfEnabled: !config.disablePdf,
  });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/session', sessionLimiter, sessionRoutes);
app.use('/api/v1/dashboard', generalLimiter, dashboardRoutes);
app.use('/api/v1/me', generalLimiter, meRoutes);
app.use('/api/v1/me/push-subscription', generalLimiter, pushRoutes);
app.use('/api/v1/checkins', sessionLimiter, checkinRoutes);
app.use('/api/v1/checkins/questionnaire', sessionLimiter, questionnaireRoutes);
app.use('/api/v1/ops', generalLimiter, opsRoutes);
app.use('/api/v1/push', generalLimiter, pushPublicRoutes);
app.use('/api/v1/admin', generalLimiter, adminRoutes);
app.use('/api/v1/cron', cronRoutes);

app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    logger.error('unhandled_error', { requestId: req.requestId, message: err.message });
    void sendAlert('api_5xx', { requestId: req.requestId, path: req.path, message: err.message });
  }
  res.status(status).json({ message: err.message || 'Internal server error' });
});

export { app };

const shouldListen = !process.env.VERCEL && process.env.NODE_ENV !== 'test';
if (shouldListen) {
  app.listen(config.port, () => {
    console.log(`PulsePath API listening on port ${config.port} (${config.nodeEnv})`);
  });
}

export default app;
