import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma para serverless (Vercel) y procesos Node normales.
 * Evita agotar el pool de Neon en cold starts repetidos.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__pulsepathPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__pulsepathPrisma = prisma;
}

export default prisma;
