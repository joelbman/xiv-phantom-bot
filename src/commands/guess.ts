import { AutocompleteInteraction, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import db from '../db';
import { IGuess, IImage, IQuiz, IUser } from '../types';
import { zones } from '../util/zones';

export const data = new SlashCommandBuilder()
  .setName('guess')
  .setDescription('Guess a location on the current running quiz')
  .addIntegerOption((option) =>
    option.setName('number').setDescription('Image number 1-5').setMinValue(1).setMaxValue(5).setRequired(true)
  )
  .addStringOption((option) =>
    option.setName('zone').setDescription('Exact zone name as written in game').setRequired(true).setAutocomplete(true)
  )
  .addNumberOption((option) => option.setName('x').setDescription('X coordinate e.g. 23.2').setRequired(true))
  .addNumberOption((option) => option.setName('y').setDescription('Y coordinate e.g. 13.7').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const now = new Date(Date.now());
  const date = now.toISOString().slice(0, 19).replace('T', ' ');

  try {
    const [rows] = await db.execute<IQuiz[]>('SELECT * FROM xivgeo_quiz WHERE ends_at > ?', [date]);

    if (!rows || rows.length < 1) {
      return interaction.reply({
        content: 'There is no active quiz currently.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const quiz = rows[0];
    const opts = interaction.options;
    const imgNumber = opts.getInteger('number');
    const x = opts.getNumber('x');
    const y = opts.getNumber('y');

    if (!x || !y || !imgNumber) {
      return interaction.reply({
        content: 'Error!',
        flags: MessageFlags.Ephemeral,
      });
    }

    // Check if user has already guessed for this specific quiz & image
    const [guess] = await db.execute<IGuess[]>('SELECT * FROM xivgeo_guess WHERE image_number = ? AND quiz_id = ?', [
      imgNumber,
      quiz.id,
    ]);

    if (guess && guess.length > 0) {
      return interaction.reply({
        content: 'You have already guessed for that specific entry!',
        flags: MessageFlags.Ephemeral,
      });
    }

    const [images] = await db.execute<IImage[]>('SELECT * FROM xivgeo_image WHERE id IN (' + quiz.image_ids + ')', [
      date,
    ]);

    if (!images) {
      return interaction.reply({
        content: 'Error, images not found!',
        flags: MessageFlags.Ephemeral,
      });
    }

    const index = (imgNumber as number) - 1;
    const imageIdArray = quiz.image_ids.split(',');

    const img = images.find((img) => img.id === parseInt(imageIdArray[index]));
    if (!img) {
      return interaction.reply({
        content: 'Error, specified image was not found',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (img.discord_id === interaction.user.id) {
      return interaction.reply({
        content: 'You cannot guess on entries that you have uploaded',
        flags: MessageFlags.Ephemeral,
      });
    }

    await db.execute<IGuess[]>(
      'INSERT INTO xivgeo_guess (discord_id, quiz_id, image_number, zone, x, y) VALUES (?, ?, ?, ?, ?, ?)',
      [
        interaction.member?.user.id,
        quiz.id,
        imgNumber,
        opts.getString('zone'),
        opts.getNumber('x'),
        opts.getNumber('y'),
      ]
    );

    // Correct answer
    if (
      parseFloat(img.x) <= x + 2 &&
      parseFloat(img.x) >= x - 2 &&
      parseFloat(img.y) >= y + 2 &&
      parseFloat(img.y) >= y - 2 &&
      img.zone === opts.getString('zone')
    ) {
      const userId = interaction.member?.user.id;

      if (!userId) {
        return interaction.reply({
          content: 'Error, could not retrieve user Discord ID',
          flags: MessageFlags.Ephemeral,
        });
      }

      const [users] = await db.execute<IUser[]>('SELECT * FROM xivgeo_user WHERE discord_id = ?', [
        interaction.member?.user.id,
      ]);

      // New user
      if (!users[0]) {
        await db.execute<IUser[]>('INSERT INTO xivgeo_user (discord_id, name, points) VALUES (?, ?, ?)', [
          interaction.member?.user.id,
          interaction.member?.user.username,
          1,
        ]);
      }
      // Update points on existing user
      else {
        await db.execute<IUser[]>('UPDATE xivgeo_user SET points = points + 1 WHERE discord_id = ?', [
          interaction.member?.user.id,
          interaction.member?.user.username,
          1,
        ]);
      }

      return interaction.reply({
        content: `Correct answer! :tada:`,
        flags: MessageFlags.Ephemeral,
      });
    }

    return interaction.reply({
      content: `Wrong answer :smiling_face_with_tear:`,
      flags: MessageFlags.Ephemeral,
    });
  } catch (e) {
    console.error(e);
    return interaction.reply({
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
