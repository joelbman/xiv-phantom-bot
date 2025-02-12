import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../db';

export interface IUser extends RowDataPacket {
  id: number;
  discord_id: string;
  points: number;
  admin: boolean;
  created_at: Date;
}

export default {
  addUser: async (id?: string, name?: string) => {
    return db.execute<ResultSetHeader>('INSERT INTO xivgeo_user (discord_id, name, points) VALUES (?, ?, ?)', [
      id,
      name,
      1,
    ]);
  },

  getUser: async (id?: string) => {
    return db.execute<IUser[]>('SELECT * FROM xivgeo_user WHERE discord_id = ?', [id]);
  },

  updateUser: async (id?: string, name?: string) => {
    return db.execute<ResultSetHeader>('UPDATE xivgeo_user SET points = points + 1, name = name WHERE discord_id = ?', [
      id,
      name,
    ]);
  },

  getLeaderboard: async () => {
    return db.execute<IUser[]>('SELECT * FROM xivgeo_user ORDER BY points DESC LIMIT 10');
  },
};
