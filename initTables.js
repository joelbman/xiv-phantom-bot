/* eslint-disable no-undef */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const { DB_USER, DB_HOSTNAME, DB_PASS, DB_DATABASE } = process.env;

const db = await mysql.createConnection({
  user: DB_USER,
  password: DB_PASS,
  database: DB_DATABASE,
  host: DB_HOSTNAME,
});

try {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS xivgeo_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discord_id VARCHAR(25) UNIQUE NOT NULL,
    points INT NOT NULL DEFAULT 0,
    admin BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS xivgeo_guess (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discord_id VARCHAR(25) NOT NULL,
    quiz_id INT NOT NULL,
    zone VARCHAR(55) NOT NULL,
    x VARCHAR(6) NOT NULL,
    y VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS xivgeo_quiz (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discord_id VARCHAR(25) UNIQUE NOT NULL,
    image_ids VARCHAR(255) NOT NULL,
    difficulty TINYINT,
    expansion VARCHAR(15) NOT NULL,
    ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS xivgeo_image (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expansion VARCHAR(15) NOT NULL,
    difficulty TINYINT,
    zone VARCHAR(55) NOT NULL,
    x VARCHAR(6) NOT NULL,
    y VARCHAR(6) NOT NULL,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`
  );

  console.log('tables created');
} catch (e) {
  console.log(e);
}
