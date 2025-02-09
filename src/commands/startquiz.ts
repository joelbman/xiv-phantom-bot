/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import db from '../db';
import { IImage, IQuiz } from '../types';

export const data = new SlashCommandBuilder()
  .setName('startquiz')
  .setDescription('Starts a new quiz')
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
  )
  .addIntegerOption((option) =>
    option.setName('difficulty').setDescription('Difficulty 1-5').setMinValue(1).setMaxValue(5)
  )
  .addStringOption((option) =>
    option.setName('imageids').setDescription('Type a comma separated list of image IDs e.g. 4,5,12,13,15')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(interaction.member?.permissions as PermissionsBitField).has([PermissionsBitField.Flags.KickMembers])) {
    return await interaction.reply({
      content: 'Permission denied',
      flags: MessageFlags.Ephemeral,
    });
  }

  const now = new Date(Date.now());
  const date = now.toISOString().slice(0, 19).replace('T', ' ');

  const [runningQuizes] = await db.execute<IQuiz[]>('SELECT * FROM xivgeo_quiz WHERE ends_at > ? AND running = 1', [
    date,
  ]);

  if (runningQuizes && runningQuizes.length > 0) {
    return await interaction.reply({
      content: 'There is already a running quiz',
      flags: MessageFlags.Ephemeral,
    });
  }

  const opts = interaction.options;
  let imageIds = '';
  let imgList;

  if (!opts.getString('imageids')) {
    let stmt = 'SELECT * FROM xivgeo_image WHERE last_used IS NULL';

    if (opts.getString('expansion')) {
      stmt += ' AND expansion = ' + opts.getString('expansion');
    }

    if (opts.getString('expansion')) {
      stmt += ' AND difficulty = ' + opts.getInteger('difficulty');
    }

    const [images] = await db.execute<IImage[]>(stmt);

    if (images.length < 5) {
      return interaction.reply({
        content: 'There are less than 5 unused images so a new quiz cannot be created.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const shuffled = images
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      .slice(0, 5);

    imageIds = shuffled.map((img) => img.id).join();
    imgList = shuffled;
  } else {
    imageIds = opts.getString('imageids') || '';

    const [images] = await db.execute<IImage[]>('SELECT * FROM xivgeo_image WHERE id IN (' + imageIds + ')');

    imgList = images;
  }

  try {
    const oneWeek = new Date(Date.now() + 6.048e8);
    const endsAt = oneWeek.toISOString().slice(0, 19).replace('T', ' ');

    const channel = interaction.channel as TextChannel;

    const embeds = [
      new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('XIV Geoguesser')
        .setDescription("A new quiz has started!\nThis week's quiz is ")
        .setFooter({ text: 'Quiz ends at ' + endsAt }),
      imgList.map((img, i) =>
        new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle('#' + (i + 1))
          .setImage(img.path)
      ),
    ].flat();

    const msg = await channel.send({ embeds: embeds });

    const [insert] = await db.execute(
      'INSERT INTO xivgeo_quiz (expansion, difficulty, image_ids, ends_at, discord_id, message_id, channel_id, running) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [
        opts.getString('expansion') ?? null,
        opts.getInteger('difficulty') ?? null,
        imageIds,
        endsAt,
        interaction.member?.user.id ?? null,
        msg.id,
        interaction.channel?.id ?? null,
      ]
    );

    return interaction.reply({
      content: 'Quiz started! Quiz ID: ' + (insert as any).insertId,
      flags: MessageFlags.Ephemeral,
    });
  } catch (e) {
    console.log(e);
    return interaction.reply({
      content: 'Error!',
      flags: MessageFlags.Ephemeral,
    });
  }
}
