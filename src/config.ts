import dotenv from 'dotenv';

dotenv.config();

const {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
  DB_USER,
  DB_HOSTNAME,
  DB_PASS,
  DB_DATABASE,
} = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error('Missing environment variables');
}

export const config = {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
  DB_USER,
  DB_PASS,
  DB_HOSTNAME,
  DB_DATABASE,
};
