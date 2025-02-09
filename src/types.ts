import { RowDataPacket } from 'mysql2';

export interface IImage extends RowDataPacket {
  id: number;
  expansion?: string;
  difficulty?: number;
  zone: string;
  x: string;
  y: string;
}

export interface IQuiz extends RowDataPacket {
  id: number;
  ends_at: string;
  image_ids: string;
  message_id: string;
  channel_id: string;
}

export interface IUser extends RowDataPacket {
  id: number;
  discord_id: string;
  points: number;
  admin: boolean;
  created_at: Date;
}

export interface IGuess extends RowDataPacket {
  id: number;
  discord_id: string;
  quiz_id: number;
  image_number: number;
  zone: string;
  x: string;
  y: string;
  created_at: Date;
}
