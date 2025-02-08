import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import db from '../db';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Shows the leaderboard');

export async function execute(interaction: CommandInteraction) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM xivgeo_user ORDER BY points DESC'
    );

    console.log(rows);
  } catch (e) {
    console.log(e);
  }

  return interaction.reply('Leaderboard:\n1. qwe');
}
