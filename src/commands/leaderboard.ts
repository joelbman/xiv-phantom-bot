import { CommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import db from '../db';
import { IUser } from '../types';

export const data = new SlashCommandBuilder().setName('leaderboard').setDescription('Shows the leaderboard');

export async function execute(interaction: CommandInteraction) {
  try {
    const [rows] = await db.execute<IUser[]>('SELECT * FROM xivgeo_user ORDER BY points DESC LIMIT 10');

    let str = '';
    rows.forEach((user, i) => {
      if (i === 0) {
        str += `${i}. ${user.name} - ${user.points}pts :crown:\n`;
      } else {
        str += `${i}. ${user.name} - ${user.points}pts\n`;
      }
    });

    return interaction.reply({ content: str, flags: MessageFlags.Ephemeral });
  } catch (e) {
    console.error(e);
    return interaction.reply({
      content: 'Error occurred while fetching the leaderboard',
      flags: MessageFlags.Ephemeral,
    });
  }
}
