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
  nodeEnv: process.env.NODE_ENV || 'development',
};
