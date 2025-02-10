import { ChatInputCommandInteraction, MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import quizService from '../services/quizService';

export const data = new SlashCommandBuilder()
  .setName('geostop')
  .setDescription('Stops the current quiz (if there is one)');

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(interaction.member?.permissions as PermissionsBitField).has([PermissionsBitField.Flags.KickMembers])) {
    return await interaction.reply({
      content: 'Permission denied',
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    const [runningQuizes] = await quizService.getRunning();

    if (runningQuizes && runningQuizes.length > 0) {
      const [update] = await quizService.stopQuiz(runningQuizes[0].id);

      if (update.affectedRows && runningQuizes[0].message_id) {
        const msg = await interaction.channel?.messages.fetch(runningQuizes[0].message_id);
        if (msg) {
          await msg.delete();
        }
      }

      return await interaction.reply({
        content: 'The current quiz has ended.',
      });
    } else {
      return await interaction.reply({
        content: 'There is no running quiz',
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (e) {
    console.log(e);
    return await interaction.reply({
      content: 'Error!',
      flags: MessageFlags.Ephemeral,
    });
  }
}
