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
    name VARCHAR(100) NOT NULL,
    points INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) CHARSET=utf8mb4_unicode_ci;`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS xivgeo_guess (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discord_id VARCHAR(25) NOT NULL,
    quiz_id INT NOT NULL,
    zone VARCHAR(75) NOT NULL,
    x FLOAT(3,1) NOT NULL,
    y FLOAT(3,1) NOT NULL,
    quiz_image_index TINYINT(1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) CHARSET=utf8mb4_unicode_ci;`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS xivgeo_quiz (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discord_id VARCHAR(25) NOT NULL,
    message_id VARCHAR(25) NOT NULL,
    channel_id VARCHAR(25) NOT NULL,
    image_ids VARCHAR(255) NOT NULL,
    difficulty TINYINT(1),
    maxdifficulty TINYINT(1),
    expansion VARCHAR(10),
    running TINYINT(1) DEFAULT 0,
    ends_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) CHARSET=utf8mb4_unicode_ci;`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS xivgeo_image (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    zone VARCHAR(55) NOT NULL,
    x FLOAT(3,1) NOT NULL,
    y FLOAT(3,1) NOT NULL,
    discord_id VARCHAR(25) NOT NULL,
    expansion VARCHAR(10),
    difficulty TINYINT(1),
    last_used TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) CHARSET=utf8mb4_unicode_ci;`
  );

  console.log('tables created');
} catch (e) {
  console.log(e);
}
