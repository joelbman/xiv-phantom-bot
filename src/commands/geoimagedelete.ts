import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, TextChannel } from 'discord.js';
import imageService from '../services/imageService';
import { config } from '../config';
import { permissionCheck } from '../util/interactionHelpers';
import quizService from '../services/quizService';

export const data = new SlashCommandBuilder()
  .setName('geoimagedelete')
  .setDescription('Delete an image')
  .addIntegerOption((option) => option.setName('id').setDescription('Image ID').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const perms = await permissionCheck(interaction);
  if (perms !== true) {
    return;
  }

  const id = interaction.options.getInteger('id');

  if (!id) {
    return interaction.reply({ content: 'Error, no ID!', flags: MessageFlags.Ephemeral });
  }

  const [img] = await imageService.getById(id);
  if (!img || !img[0]) {
    return interaction.reply({ content: 'Image not found!', flags: MessageFlags.Ephemeral });
  }

  const [runningQuizes] = await quizService.getRunning();
  if (runningQuizes[0]) {
    const ids = runningQuizes[0].image_ids.split(',');
    if (ids.includes(id.toString())) {
      return interaction.reply({
        content: 'That image is currently being used in a quiz! Stop the quiz before deleting',
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  try {
    await imageService.deleteImage(id);
  } catch (e) {
    console.error(e);
    return interaction.reply({ content: 'Error!', flags: MessageFlags.Ephemeral });
  }

  // Delete image log channel entry if the channel & message exists
  if (config.IMAGE_CHANNEL_ID) {
    const channel = (await interaction.guild?.channels.fetch(config.IMAGE_CHANNEL_ID)) as TextChannel;
    if (channel) {
      const msg = await channel.messages.fetch(img[0].message_id);
      if (msg) {
        await msg.delete();
      }
    }
  }

  return interaction.reply({ content: 'Deleted!', flags: MessageFlags.Ephemeral });
}
