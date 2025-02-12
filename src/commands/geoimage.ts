import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { zones, zonesByExpansion } from '../util/zones';
import imageService from '../services/imageService';
import { config } from '../config';
import { permissionCheck } from '../util/interactionHelpers';

const expansionMapping: { [key: string]: number } = {
  arr: 1,
  hw: 2,
  sb: 3,
  shb: 4,
  ew: 5,
  dt: 6,
};

export const data = new SlashCommandBuilder()
  .setName('geoimage')
  .setDescription('Adds a new image to the quiz pool')
  .addAttachmentOption((option) => option.setName('image').setDescription('Image').setRequired(true))
  .addStringOption((option) =>
    option.setName('zone').setDescription('Zone name').setRequired(true).setAutocomplete(true)
  )
  .addNumberOption((option) => option.setName('x').setDescription('X').setRequired(true))
  .addNumberOption((option) => option.setName('y').setDescription('Y').setRequired(true))
  .addIntegerOption((option) =>
    option.setName('difficulty').setDescription('Difficulty 1-5').setMaxValue(5).setMinValue(1).setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const perms = await permissionCheck(interaction);
  if (perms !== true) {
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!config.IMAGE_CHANNEL_ID) {
    return await interaction.editReply({ content: 'Missing image channel ID' });
  }

  const channel = interaction.guild?.channels.cache.get(config.IMAGE_CHANNEL_ID) as TextChannel;
  if (!channel) {
    return await interaction.editReply({ content: 'Error retrieving image channel' });
  }

  const opts = interaction.options;

  let expansion = '';

  Object.entries(zonesByExpansion).forEach(([key, value]) => {
    const found = value.find((z) => z === opts.getString('zone'));
    if (found) {
      expansion = key;
    }
  });

  try {
    const [insert] = await imageService.addImage({
      url: opts.getAttachment('image')?.url || '',
      expansion: expansion ? expansionMapping[expansion] : null,
      difficulty: opts.getInteger('difficulty') ?? null,
      zone: opts.getString('zone') || '',
      x: opts.getNumber('x') || 1,
      y: opts.getNumber('y') || 1,
      discord_id: interaction.user.id,
    });

    if (!insert.insertId) {
      return await interaction.editReply({ content: 'Image insert failed' });
    }

    const msg = await channel.send({
      content: `**Image #${insert.insertId}**\n||Zone: ${opts.getString('zone')}\nX: ${opts.getNumber(
        'x'
      )} / Y: ${opts.getNumber('y')}\nDifficulty: ${opts.getInteger('difficulty')}\n||`,
      files: [{ attachment: opts.getAttachment('image')?.url || '', name: `SPOILER_img_${insert.insertId}.png` }],
    });

    if (msg?.id && msg.attachments.first()?.url) {
      await imageService.updateImage(insert.insertId, msg.id, msg.attachments.first()?.url);
    } else {
      await imageService.deleteImage(insert.insertId);
      return await interaction.editReply({
        content: 'Failed to retrieve image log message/attachment',
      });
    }

    return await interaction.editReply({
      content: 'Donezo :ok_hand: - Image ID: ' + insert.insertId,
    });
  } catch (e) {
    console.log(e);
    return await interaction.editReply({
      content: 'Error!',
    });
  }
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused();
  const filtered = zones.filter((choice) => choice.toLocaleLowerCase().includes(focusedValue.toLocaleLowerCase()));
  const options = filtered.length > 25 ? filtered.slice(0, 25) : filtered;
  await interaction.respond(options.map((choice) => ({ name: choice, value: choice })));
}
