import mysql from 'mysql2/promise';
import { config } from './config';

export default mysql.createPool({
  user: config.DB_USER,
  password: config.DB_PASS,
  database: config.DB_DATABASE,
});
