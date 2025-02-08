import { RowDataPacket } from 'mysql2';

export interface IUser extends RowDataPacket {
  id: number;
  discord_id: string;
  points: number;
  admin: boolean;
  created_at: Date;
}
