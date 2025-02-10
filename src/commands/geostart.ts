/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import imageService from '../services/imageService';
import quizService from '../services/quizService';

const difficultyMapping: { [key: number]: string } = {
  1: 'Very easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Extreme',
};

export const data = new SlashCommandBuilder()
  .setName('geostart')
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
  .addIntegerOption((option) =>
    option.setName('maxdifficulty').setDescription('Max difficulty 2-4').setMinValue(2).setMaxValue(4)
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

  const [runningQuizes] = await quizService.getRunning();

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
    const [images] = await imageService.getUnused({
      expansion: opts.getString('expansion'),
      difficulty: opts.getInteger('difficulty'),
      maxDifficulty: opts.getInteger('maxdifficulty'),
    });

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

    const [images] = await imageService.getByIds(imageIds);

    imgList = images;
  }

  try {
    const oneWeek = new Date(Date.now() + 6.048e8);
    const endsAt = oneWeek.toISOString().slice(0, 19).replace('T', ' ');

    const channel = interaction.channel as TextChannel;

    const role = interaction.guild?.roles.cache.find((r) => r.name === 'GeoGuess');

    let difficultyText = '';

    if (opts.getInteger('maxdifficulty')) {
      difficultyText = 'Very easy - ' + difficultyMapping[opts.getInteger('maxdifficulty') as number];
    } else if (opts.getInteger('difficulty')) {
      difficultyText = difficultyMapping[opts.getInteger('difficulty') as number];
    } else {
      difficultyText = 'Any';
    }

    const embeds = [
      new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('XIV Geoguesser')
        .setDescription(`A new quiz has started! ${role?.id && `<@&${role.id}>`}`)
        .addFields(
          { name: 'Difficulty', value: difficultyText, inline: true },
          { name: 'Expansion', value: opts.getString('expansion')?.toLocaleUpperCase() || 'Any', inline: true }
        )
        .setFooter({ text: 'Quiz ends at ' + endsAt }),
      imgList.map((img, i) =>
        new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle('#' + (i + 1))
          .setImage(img.url)
      ),
    ].flat();

    const msg = await channel.send({ embeds: embeds });

    const [insert] = await quizService.addQuiz({
      image_ids: imageIds,
      ends_at: endsAt,
      message_id: msg.id,
      channel_id: interaction.channel?.id || '',
      discord_id: interaction.user.id,
      expansion: opts.getString('expansion') ?? null,
      difficulty: opts.getInteger('difficulty') ?? null,
      maxdifficulty: opts.getInteger('maxdifficulty') ?? null,
    });

    if (!insert.insertId) {
      await msg.delete();
    }

    // await imageService.markAsUsed(imageIds);

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
