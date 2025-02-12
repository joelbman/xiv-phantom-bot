import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../db';
import { dates } from '../util/date';

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
  expansion?: number | null;
  difficulty?: number | null;
}

export default {
  addImage: async ({ url, expansion, difficulty, zone, x, y, discord_id }: AddImagePayload) => {
    return db.execute<ResultSetHeader>(
      'INSERT INTO xivgeo_image (created_at, url, expansion, difficulty, zone, x, y, discord_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [dates.now(), url, expansion, difficulty, zone, x, y, discord_id]
    );
  },

  deleteImage: async (id: number) => {
    const img = await db.execute<IImage[]>('SELECT * FROM xivgeo_image WHERE id = ?', [id]);

    if (!img || !img[0]) {
      return;
    }

    return db.execute<ResultSetHeader>('DELETE FROM xivgeo_image WHERE id = ?', [id]);
  },

  updateImage: async (id: number, messageId: string, url?: string) => {
    return db.execute<ResultSetHeader>('UPDATE xivgeo_image SET message_id = ?, url = ? WHERE id = ?', [
      messageId,
      url,
      id,
    ]);
  },

  getImages: async ({
    expansion,
    difficulty,
    maxDifficulty,
    maxExpansion,
    allowUsed,
  }: {
    expansion?: number | null;
    difficulty?: number | null;
    maxDifficulty?: number | null;
    maxExpansion?: number | null;
    allowUsed?: boolean | null;
  }) => {
    // there has to be a better way? :D
    let stmt = allowUsed
      ? 'SELECT * FROM xivgeo_image WHERE id IS NOT NULL'
      : 'SELECT * FROM xivgeo_image WHERE last_used IS NULL';

    if (expansion) {
      stmt += ' AND expansion = ' + expansion;
    } else if (maxExpansion) {
      stmt += ' AND expansion <= ' + maxExpansion;
    }

    if (difficulty) {
      stmt += ' AND difficulty = ' + difficulty;
    } else if (maxDifficulty) {
      stmt += ' AND difficulty <= ' + maxDifficulty;
    }

    return db.execute<IImage[]>(stmt);
  },

  getById: async (id: number) => {
    return db.execute<IImage[]>('SELECT * FROM xivgeo_image WHERE id = ?', [id]);
  },

  getByIds: async (imageIds: string) => {
    return db.execute<IImage[]>('SELECT * FROM xivgeo_image WHERE id IN (' + imageIds + ')');
  },

  markAsUsed: async (imageIds: string) => {
    return db.execute('UPDATE xivgeo_image SET last_used = ? WHERE id IN (' + imageIds + ')', [dates.now()]);
  },
};
