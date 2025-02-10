import { RowDataPacket } from 'mysql2';
import db from '../db';

export interface IImage extends RowDataPacket {
  id: number;
  zone: string;
  x: number;
  y: number;
  discord_id: string;
  url: string;
  expansion?: string;
  difficulty?: number;
}

interface AddImagePayload {
  zone: string;
  x: number;
  y: number;
  discord_id: string;
  url: string;
  expansion?: string;
  difficulty?: number;
}

export default {
  addImage: async ({ url, expansion, difficulty, zone, x, y, discord_id }: AddImagePayload) => {
    return db.execute(
      'INSERT INTO xivgeo_image (path, expansion, difficulty, zone, x, y, discord_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [url, expansion, difficulty, zone, x, y, discord_id]
    );
  },

  getUnused: async ({
    expansion,
    difficulty,
    maxDifficulty,
  }: {
    expansion?: string | null;
    difficulty?: number | null;
    maxDifficulty?: number | null;
  }) => {
    let stmt = 'SELECT * FROM xivgeo_image WHERE last_used IS NULL';

    if (expansion) {
      stmt += ' AND expansion = ' + expansion;
    }

    if (difficulty) {
      stmt += ' AND difficulty = ' + difficulty;
    } else if (maxDifficulty) {
      stmt += ' AND difficulty <= ' + maxDifficulty;
    }

    return db.execute<IImage[]>(stmt);
  },

  getByIds: async (imageIds: string) => {
    return db.execute<IImage[]>('SELECT * FROM xivgeo_image WHERE id IN (' + imageIds + ')');
  },
};
