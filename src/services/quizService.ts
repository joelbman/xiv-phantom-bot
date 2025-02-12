import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../db';
import { dates } from '../util/date';

export interface IQuiz extends RowDataPacket {
  id: number;
  ends_at: string;
  image_ids: string;
  message_id: string;
  channel_id: string;
  discord_id: string;
  expansion?: number | null;
  maxexpansion?: number | null;
  difficulty?: number | null;
  maxdifficulty?: number | null;
  running?: number;
}

interface AddQuizPayload {
  created_at: string;
  ends_at: string;
  image_ids: string;
  message_id: string;
  channel_id: string;
  discord_id: string;
  expansion?: number | null;
  maxexpansion?: number | null;
  difficulty?: number | null;
  maxdifficulty?: number | null;
  running?: number;
}

export default {
  addQuiz: async ({
    created_at,
    ends_at,
    discord_id,
    message_id,
    channel_id,
    image_ids,
    expansion,
    maxexpansion,
    difficulty,
    maxdifficulty,
  }: AddQuizPayload) => {
    return db.execute<ResultSetHeader>(
      'INSERT INTO xivgeo_quiz (created_at, expansion, maxexpansion, difficulty, maxdifficulty, image_ids, ends_at, discord_id, message_id, channel_id, running) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [
        created_at,
        expansion,
        maxexpansion,
        difficulty,
        maxdifficulty,
        image_ids,
        ends_at,
        discord_id,
        message_id,
        channel_id,
      ]
    );
  },
  getExpired: async () => {
    return db.execute<IQuiz[]>('SELECT * FROM xivgeo_quiz WHERE ends_at < ? AND running = 1', [dates.now()]);
  },
  getRunning: async () => {
    return db.execute<IQuiz[]>('SELECT * FROM xivgeo_quiz WHERE ends_at > ? AND running = 1', [dates.now()]);
  },
  stopQuiz: async (quizId: number) => {
    return db.execute<ResultSetHeader>('UPDATE xivgeo_quiz SET running = 0 WHERE id = ?', [quizId]);
  },
};
