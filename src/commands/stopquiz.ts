import { ChatInputCommandInteraction, MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { IQuiz } from '../types';
import db from '../db';

export const data = new SlashCommandBuilder()
  .setName('stopquiz')
  .setDescription('Stops the current quiz (if there is one)');

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(interaction.member?.permissions as PermissionsBitField).has([PermissionsBitField.Flags.KickMembers])) {
    return await interaction.reply({
      content: 'Permission denied',
      flags: MessageFlags.Ephemeral,
    });
  }

  const now = new Date(Date.now());
  const date = now.toISOString().slice(0, 19).replace('T', ' ');

  try {
    const [runningQuizes] = await db.execute<IQuiz[]>('SELECT * FROM xivgeo_quiz WHERE ends_at > ? AND running = 1', [
      date,
    ]);

    if (runningQuizes && runningQuizes.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [update] = await db.execute<any>('UPDATE xivgeo_quiz SET running = ? WHERE ends_at > ? AND running = 1', [
        0,
        date,
      ]);

      if (update.affectedRows && runningQuizes[0].message_id) {
        console.log(runningQuizes[0].message_id);
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
