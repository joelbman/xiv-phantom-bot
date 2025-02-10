import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../db';

export interface IQuiz extends RowDataPacket {
  id: number;
  ends_at: string;
  image_ids: string;
  message_id: string;
  channel_id: string;
  discord_id: string;
  expansion?: string | null;
  difficulty?: number | null;
  maxdifficulty?: number | null;
  running?: number;
}

interface AddQuizPayload {
  ends_at: string;
  image_ids: string;
  message_id: string;
  channel_id: string;
  discord_id: string;
  expansion?: string | null;
  difficulty?: number | null;
  maxdifficulty?: number | null;
  running?: number;
}

export default {
  addQuiz: async ({
    ends_at,
    discord_id,
    message_id,
    channel_id,
    image_ids,
    expansion,
    difficulty,
    maxdifficulty,
  }: AddQuizPayload) => {
    return db.execute<ResultSetHeader>(
      'INSERT INTO xivgeo_quiz (expansion, difficulty, maxdifficulty, image_ids, ends_at, discord_id, message_id, channel_id, running) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [expansion, difficulty, maxdifficulty, image_ids, ends_at, discord_id, message_id, channel_id]
    );
  },
  getExpired: async () => {
    const now = new Date(Date.now());
    const date = now.toISOString().slice(0, 19).replace('T', ' ');
    return db.execute<IQuiz[]>('SELECT * FROM xivgeo_quiz WHERE ends_at < ? AND running = 1', [date]);
  },
  getRunning: async () => {
    const now = new Date(Date.now());
    const date = now.toISOString().slice(0, 19).replace('T', ' ');
    return db.execute<IQuiz[]>('SELECT * FROM xivgeo_quiz WHERE ends_at > ? AND running = 1', [date]);
  },
  stopQuiz: async (quizId: number) => {
    return db.execute<ResultSetHeader>('UPDATE xivgeo_quiz SET running = 0 WHERE id = ?', [quizId]);
  },
};
