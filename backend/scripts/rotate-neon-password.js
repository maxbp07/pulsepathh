/**
 * Rota la password de Neon vía SQL y actualiza backend/.env
 * Uso: node scripts/rotate-neon-password.js
 * No imprime secretos.
 */
import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

function readEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

function writeEnv(file, map) {
  const lines = Object.entries(map).map(([k, v]) => `${k}=${v ?? ''}`);
  fs.writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');
}

function rebuildUrl(oldUrl, newPass) {
  const m = oldUrl.match(/^(postgresql(?:\+[^:]+)?:\/\/)([^:]+):([^@]+)@(.+)$/);
  if (!m) throw new Error('Cannot parse DATABASE_URL');
  return `${m[1]}${m[2]}:${encodeURIComponent(newPass)}@${m[4]}`;
}

const env = readEnv(envPath);
const prisma = new PrismaClient();
const newPass = crypto.randomBytes(24).toString('base64url');

try {
  await prisma.$executeRawUnsafe(`ALTER ROLE neondb_owner WITH PASSWORD '${newPass.replace(/'/g, "''")}'`);
  const newUrl = rebuildUrl(env.DATABASE_URL, newPass);
  await prisma.$disconnect();

  // verify with new client
  process.env.DATABASE_URL = newUrl;
  const verify = new PrismaClient();
  await verify.$queryRawUnsafe('SELECT 1 AS ok');
  await verify.$disconnect();

  env.DATABASE_URL = newUrl;
  writeEnv(envPath, env);
  writeEnv(path.join(__dirname, '..', '.env.vercel'), env);
  console.log('NEON_PASSWORD_ROTATED_AND_VERIFIED');
} catch (err) {
  console.error('NEON_ROTATE_FAILED', err.message.slice(0, 200));
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
}
