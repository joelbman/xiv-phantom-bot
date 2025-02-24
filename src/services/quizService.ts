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
  mindifficulty?: number | null;
  maxdifficulty?: number | null;
  running?: number;
  has_been_completed?: number | null;
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
  mindifficulty?: number | null;
  maxdifficulty?: number | null;
  running?: number;
}

interface ICorrects extends RowDataPacket {
  maxdate: string;
  guesses: number;
  discord_id: string;
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
    mindifficulty,
    maxdifficulty,
  }: AddQuizPayload) => {
    return db.execute<ResultSetHeader>(
      'INSERT INTO xivgeo_quiz (created_at, expansion, maxexpansion, mindifficulty, maxdifficulty, image_ids, ends_at, discord_id, message_id, channel_id, running) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [
        created_at,
        expansion,
        maxexpansion,
        mindifficulty,
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
  getAll: async () => {
    return db.execute<IQuiz[]>('SELECT * FROM xivgeo_quiz');
  },
  getCorrects: async (quizId: number) => {
    return db.execute<ICorrects[]>(
      'SELECT * FROM (SELECT MAX(created_at) AS maxdate, COUNT(quiz_id) AS guesses, discord_id FROM xivgeo_guess WHERE quiz_id = ? AND correct = 1 GROUP BY discord_id) a WHERE a.guesses = 5',
      [quizId]
    );
  },
  markCompleted: async (quizId: number) => {
    return db.execute<ResultSetHeader>('UPDATE xivgeo_quiz SET has_been_completed = 1 WHERE id = ?', [quizId]);
  },
};
