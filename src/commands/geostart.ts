/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder, TextChannel } from 'discord.js';
import imageService from '../services/imageService';
import quizService from '../services/quizService';
import { permissionCheck } from '../util/interactionHelpers';
import { dates } from '../util/date';

const difficultyMapping: { [key: number]: string } = {
  1: 'Very easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Extreme',
};

const expansionMapping: { [key: number]: string } = {
  1: 'A Realm Reborn',
  2: 'Heavensward',
  3: 'Stormblood',
  4: 'Shadowbringers',
  5: 'Endwalker',
  6: 'Dawntrail',
};

export const data = new SlashCommandBuilder()
  .setName('geostart')
  .setDescription('Starts a new quiz')
  .addIntegerOption((option) =>
    option
      .setName('expansion')
      .setDescription('Include only images from selected expansion')
      .addChoices(
        { name: 'ARR', value: 1 },
        { name: 'HW', value: 2 },
        { name: 'SB', value: 3 },
        { name: 'SHB', value: 4 },
        { name: 'EW', value: 5 },
        { name: 'DT', value: 6 }
      )
  )
  .addIntegerOption((option) =>
    option
      .setName('maxexpansion')
      .setDescription('Include images from selected and all previous expansions')
      .addChoices(
        { name: 'HW', value: 2 },
        { name: 'SB', value: 3 },
        { name: 'SHB', value: 4 },
        { name: 'EW', value: 5 }
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
  )
  .addIntegerOption((option) =>
    option.setName('duration').setDescription('Duration in days 1-7').setMinValue(1).setMaxValue(7)
  )
  .addBooleanOption((option) => option.setName('allowused').setDescription('Allow already used images'));

export async function execute(interaction: ChatInputCommandInteraction) {
  const perms = await permissionCheck(interaction);
  if (perms !== true) {
    return;
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
    const [images] = await imageService.getImages({
      expansion: opts.getInteger('expansion'),
      difficulty: opts.getInteger('difficulty'),
      maxDifficulty: opts.getInteger('maxdifficulty'),
      maxExpansion: opts.getInteger('maxexpansion'),
      allowUsed: opts.getBoolean('allowused'),
    });

    if (images.length < 5) {
      return interaction.reply({
        content: 'Found less than 5 images with selected options so a new quiz cannot be created.',
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
    console.log(imageIds);
    if (imageIds && imageIds.split(',').length !== 5) {
      return interaction.reply({
        content: 'Invalid ID list input',
        flags: MessageFlags.Ephemeral,
      });
    }

    const [images] = await imageService.getByIds(imageIds);
    console.log(images);

    if (images.length < 5) {
      return interaction.reply({
        content: 'Found less than 5 images with selected options so a new quiz cannot be created.',
        flags: MessageFlags.Ephemeral,
      });
    }

    imgList = images;
  }

  const endsAt = opts.getInteger('duration') ? dates.days(opts.getInteger('duration') || 7) : dates.oneWeek();
  const channel = interaction.channel as TextChannel;
  const role = interaction.guild?.roles.cache.find((r) => r.name === 'GeoGuess');
  let difficultyText = '',
    expansionText = '';

  if (opts.getInteger('maxdifficulty')) {
    difficultyText = 'Very easy - ' + difficultyMapping[opts.getInteger('maxdifficulty') as number];
  } else if (opts.getInteger('difficulty')) {
    difficultyText = difficultyMapping[opts.getInteger('difficulty') as number];
  } else {
    difficultyText = 'Any';
  }

  if (opts.getInteger('maxexpansion')) {
    expansionText = 'ARR - ' + expansionMapping[opts.getInteger('maxexpansion') as number];
  } else if (opts.getInteger('expansion')) {
    expansionText = expansionMapping[opts.getInteger('expansion') as number];
  } else {
    expansionText = 'Any';
  }

  const embeds = imgList.map((img, i) =>
    new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('#' + (i + 1))
      .setImage(img.url)
  );

  const content = `A new quiz has started! ${
    role?.id ? `<@&${role.id}>` : ''
  }\n\n**Difficulty:** ${difficultyText}\n**Expansion(s):** ${expansionText}\n## How to participate:\nFly around in zones looking for the spots in the images. Once you think you've found the spot, submit a guess by typing \`/geoguess\`\n\nExample guess:\n\`\`\`/geoguess number:3 zone:Western Thanalan x:5.2 y:4.3\`\`\`\n- The coordinates must be +-2.0 of the exact coordinates given by the image uploader\n- Zone name must match exactly how it is written in game. The bot will help you by autocompleting once you start typing the zone name\n- You can only guess once per image, each correct answer will give you a point\n### The quiz will end at:\n${endsAt}\n\nGood luck!\n\n`;

  try {
    const msg = await channel.send({ embeds: embeds, content: content });

    const [insert] = await quizService.addQuiz({
      image_ids: imageIds,
      created_at: dates.now(),
      ends_at: endsAt,
      message_id: msg.id,
      channel_id: interaction.channel?.id || '',
      discord_id: interaction.user.id,
      expansion: opts.getInteger('expansion') ?? null,
      maxexpansion: opts.getInteger('expansion') ?? null,
      difficulty: opts.getInteger('difficulty') ?? null,
      maxdifficulty: opts.getInteger('maxdifficulty') ?? null,
    });

    if (!insert.insertId) {
      await msg.delete();
    }

    await imageService.markAsUsed(imageIds);

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
