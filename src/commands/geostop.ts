import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, TextChannel } from 'discord.js';
import quizService from '../services/quizService';
import { permissionCheck } from '../util/interactionHelpers';

export const data = new SlashCommandBuilder()
  .setName('geostop')
  .setDescription('Stops the current quiz (if there is one)');

export async function execute(interaction: ChatInputCommandInteraction) {
  const perms = await permissionCheck(interaction);
  if (perms !== true) {
    return;
  }

  try {
    const [runningQuizes] = await quizService.getRunning();

    if (runningQuizes && runningQuizes.length > 0) {
      const [update] = await quizService.stopQuiz(runningQuizes[0].id);

      if (update.affectedRows && runningQuizes[0].message_id) {
        const channel = (await interaction.guild?.channels.fetch(runningQuizes[0].channel_id)) as TextChannel;
        if (!channel) {
          return await interaction.reply({
            content: 'Error retrieving channel',
            flags: MessageFlags.Ephemeral,
          });
        }
        const msg = await channel.messages.fetch(runningQuizes[0].message_id);
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
