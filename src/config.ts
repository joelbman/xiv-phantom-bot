import dotenv from 'dotenv';

dotenv.config();

const { BOT_TOKEN, BOT_CLIENT_ID, DB_USER, DB_HOSTNAME, DB_PASS, DB_DATABASE, GUILD_ID, IMAGE_CHANNEL_ID } =
  process.env;

if (!BOT_TOKEN) {
  throw new Error('Missing environment variables');
}

export const config = {
  BOT_TOKEN,
  BOT_CLIENT_ID,
  DB_USER,
  DB_PASS,
  DB_HOSTNAME,
  DB_DATABASE,
  GUILD_ID,
  IMAGE_CHANNEL_ID,
};
