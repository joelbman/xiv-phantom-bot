import { RowDataPacket } from 'mysql2';
import db from '../db';

export interface IGuess extends RowDataPacket {
  id: number;
  discord_id: string;
  quiz_id: number;
  quiz_image_index: number;
  image_id: number;
  zone: string;
  x: string;
  y: string;
  created_at: Date;
}

interface AddGuessPayload {
  discordId: string;
  quizId: number;
  imgNumber: number;
  image_id: number;
  zone: string;
  x: number;
  y: number;
}

export default {
  addGuess: async ({ discordId, quizId, imgNumber, zone, x, y }: AddGuessPayload) => {
    await db.execute<IGuess[]>(
      'INSERT INTO xivgeo_guess (discord_id, quiz_id, quiz_image_index, zone, x, y) VALUES (?, ?, ?, ?, ?, ?)',
      [discordId, quizId, imgNumber, zone, x, y]
    );
  },
  hasGuessed: async (imgNumber: number, quizId: number, discordId: string) => {
    const [guesses] = await db.execute<IGuess[]>(
      'SELECT * FROM xivgeo_guess WHERE quiz_image_index = ? AND quiz_id = ? AND discord_id = ?',
      [imgNumber, quizId, discordId]
    );

    return guesses && guesses.length > 0;
  },
};
