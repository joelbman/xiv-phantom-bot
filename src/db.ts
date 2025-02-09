import mysql from 'mysql2/promise';
import { config } from './config';

const db = mysql.createPool({
  user: config.DB_USER,
  password: config.DB_PASS,
  database: config.DB_DATABASE,
  host: config.DB_HOSTNAME,
  timezone: 'Z',
});

export default db;
