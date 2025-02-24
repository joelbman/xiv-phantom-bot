import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { permissionCheck } from '../util/interactionHelpers';
import quizService from '../services/quizService';

// WIP COMMAND

export const data = new SlashCommandBuilder()
  .setName('geostatus')
  .setDescription('Displays information about the ongoing quiz');

export async function execute(interaction: ChatInputCommandInteraction) {
  const perms = await permissionCheck(interaction);
  if (perms !== true) {
    return;
  }

  const [running] = await quizService.getRunning();

  if (!running || !running[0]) {
    return interaction.reply({
      content: 'There is no quiz running',
      flags: MessageFlags.Ephemeral,
    });
  }

  const [corrects] = await quizService.getCorrects(running[0].id);

  if (!corrects || !corrects[0]) {
    return interaction.reply({
      content: 'Nobody has guessed all 5 correct yet',
      flags: MessageFlags.Ephemeral,
    });
  }

  let min: { maxdate: string; discord_id: string; guesses: number } = { maxdate: '', discord_id: '', guesses: 0 };
  corrects.forEach((c) => {
    if (!min.maxdate || min.maxdate > c.maxdate) {
      min = c;
    }
  });

  return interaction.reply({
    content: 'beep',
    flags: MessageFlags.Ephemeral,
  });
}
