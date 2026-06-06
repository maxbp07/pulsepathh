import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { config } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import sessionRoutes from './routes/session.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import meRoutes from './routes/me.routes.js';
import { authLimiter, sessionLimiter, generalLimiter } from './middleware/rateLimit.js';

const app = express();
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'pulsepath-api',
    version: '1.0.0',
  });
});

app.get('/health', async (_req, res) => {
  let db = 'disconnected';

  try {
    await prisma.$connect();
    db = 'connected';
  } catch {
    db = 'disconnected';
  }

  res.json({ status: 'ok', db });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/session', sessionLimiter, sessionRoutes);
app.use('/api/v1/dashboard', generalLimiter, dashboardRoutes);
app.use('/api/v1/me', generalLimiter, meRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`PulsePath API listening on port ${config.port} (${config.nodeEnv})`);
});
