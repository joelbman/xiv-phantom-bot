/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CommandInteraction,
  MessageFlags,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';
import db from '../db';

export const data = new SlashCommandBuilder()
  .setName('addimage')
  .setDescription('Adds a new image to the quiz pool')
  .addAttachmentOption((option) =>
    option.setName('image').setDescription('Image').setRequired(true)
  )
  .addStringOption((option) =>
    option.setName('zone').setDescription('Zone name').setRequired(true)
  )
  .addNumberOption((option) =>
    option.setName('x').setDescription('X').setRequired(true)
  )
  .addNumberOption((option) =>
    option.setName('y').setDescription('Y').setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('difficulty')
      .setDescription('Difficulty 1-5')
      .setMaxValue(5)
      .setMinValue(1)
  )
  .addStringOption((option) =>
    option
      .setName('expansion')
      .setDescription('Expansion')
      .addChoices(
        { name: 'ARR', value: 'arr' },
        { name: 'HW', value: 'hw' },
        { name: 'SB', value: 'sb' },
        { name: 'SHB', value: 'shb' },
        { name: 'EW', value: 'ew' },
        { name: 'DT', value: 'dt' }
      )
  );

export async function execute(interaction: CommandInteraction) {
  if (
    !(interaction.member?.permissions as PermissionsBitField).has([
      PermissionsBitField.Flags.KickMembers,
    ])
  ) {
    await interaction.reply({
      content: 'Permission denied',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const opts = interaction.options as any;

  try {
    const [rows] = await db.execute(
      'INSERT INTO xivgeo_image (path, expansion, difficulty, zone, x, y) VALUES (?, ?, ?, ?, ?, ?)',
      [
        opts.getAttachment('image').url,
        opts.getString('expansion') ?? null,
        opts.getInteger('difficulty') ?? null,
        opts.getString('zone'),
        opts.getNumber('x'),
        opts.getNumber('y'),
      ]
    );
    console.log(rows);
    await interaction.reply({
      content: 'Donezo :ok_hand: - Image ID: ' + (rows as any).insertId,
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
