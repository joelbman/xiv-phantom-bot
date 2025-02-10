/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AutocompleteInteraction,
  CommandInteraction,
  MessageFlags,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';
import { zones } from '../util/zones';
import imageService from '../services/imageService';

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
    option.setName('difficulty').setDescription('Difficulty 1-5').setMaxValue(5).setMinValue(1)
  )
  .addIntegerOption((option) =>
    option
      .setName('expansion')
      .setDescription('Expansion')
      .addChoices(
        { name: 'ARR', value: 1 },
        { name: 'HW', value: 2 },
        { name: 'SB', value: 3 },
        { name: 'SHB', value: 4 },
        { name: 'EW', value: 5 },
        { name: 'DT', value: 6 }
      )
  );

export async function execute(interaction: CommandInteraction) {
  if (!(interaction.member?.permissions as PermissionsBitField).has([PermissionsBitField.Flags.KickMembers])) {
    await interaction.reply({
      content: 'Permission denied',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const opts = interaction.options as any;

  try {
    const [insert] = await imageService.addImage({
      url: opts.getAttachment('image').url,
      expansion: opts.getInteger('expansion') ?? null,
      difficulty: opts.getInteger('difficulty') ?? null,
      zone: opts.getString('zone'),
      x: opts.getNumber('x'),
      y: opts.getNumber('y'),
      discord_id: interaction.user.id,
    });
    await interaction.reply({
      content: 'Donezo :ok_hand: - Image ID: ' + (insert as any).insertId,
      flags: MessageFlags.Ephemeral,
    });
  } catch (e) {
    console.log(e);
    await interaction.reply({
      content: 'Error!',
      flags: MessageFlags.Ephemeral,
    });
  }
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused();
  const filtered = zones.filter((choice) => choice.toLocaleLowerCase().includes(focusedValue.toLocaleLowerCase()));
  const options = filtered.length > 25 ? filtered.slice(0, 25) : filtered;
  await interaction.respond(options.map((choice) => ({ name: choice, value: choice })));
}
