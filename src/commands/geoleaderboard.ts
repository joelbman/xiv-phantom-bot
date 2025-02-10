import { CommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import userService from '../services/userService';

export const data = new SlashCommandBuilder()
  .setName('geoleaderboard')
  .setDescription('Shows the geoguessing leaderboard');

export async function execute(interaction: CommandInteraction) {
  try {
    const [rows] = await userService.getLeaderboard();

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
