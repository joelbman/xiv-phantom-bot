import { RowDataPacket } from 'mysql2';
import db from '../db';
import quizService from './quizService';
import imageService from './imageService';

export interface IGuess extends RowDataPacket {
  id: number;
  discord_id: string;
  quiz_id: number;
  quiz_image_index: number;
  image_id: number;
  zone: string;
  x: number;
  y: number;
  created_at: string;
  correct: number;
}

interface AddGuessPayload {
  discordId: string;
  quizId: number;
  imgNumber: number;
  image_id: number;
  zone: string;
  x: number;
  y: number;
  correct?: number;
}

export default {
  addGuess: async ({ discordId, quizId, imgNumber, zone, x, y, correct }: AddGuessPayload) => {
    return await db.execute<IGuess[]>(
      'INSERT INTO xivgeo_guess (discord_id, quiz_id, quiz_image_index, zone, x, y, correct) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [discordId, quizId, imgNumber, zone, x, y, correct]
    );
  },
  hasGuessed: async (imgNumber: number, quizId: number, discordId: string) => {
    const [guesses] = await db.execute<IGuess[]>(
      'SELECT * FROM xivgeo_guess WHERE quiz_image_index = ? AND quiz_id = ? AND discord_id = ?',
      [imgNumber, quizId, discordId]
    );

    return guesses && guesses.length > 0;
  },
  getGuessesByQuiz: async (quizId: number, correct?: boolean) => {
    return db.execute<IGuess[]>('SELECT * FROM xivgeo_guess WHERE quiz_id = ? and correct = ?', [quizId, correct || 0]);
  },
  markCorrect: async () => {
    const [nulls] = await db.execute<IGuess[]>('SELECT * FROM xivgeo_guess WHERE correct IS NULL');

    const [quizes] = await quizService.getAll();

    const [images] = await imageService.getAll();

    nulls.forEach(async (guess) => {
      const quiz = quizes.find((q) => q.id === guess.quiz_id);
      const split = quiz?.image_ids.split(',');
      if (!split) {
        return;
      }
      const imgId = split[guess.quiz_image_index - 1];
      const img = images.find((i) => i.id === parseInt(imgId));
      if (!img) {
        return;
      }
      if (
        guess.x >= img.x - 2 &&
        guess.x <= img.x + 2 &&
        guess.y >= img.y - 2 &&
        guess.y <= img.y + 2 &&
        img.zone.toLocaleLowerCase() === guess.zone.toLocaleLowerCase()
      ) {
        await db.execute('UPDATE xivgeo_guess SET correct = 1 WHERE id = ?', [guess.id]);
      } else {
        await db.execute('UPDATE xivgeo_guess SET correct = 0 WHERE id = ?', [guess.id]);
      }
    });
  },
};
