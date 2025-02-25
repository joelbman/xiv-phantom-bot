import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { zones } from '../util/zones';
import userService from '../services/userService';
import imageService from '../services/imageService';
import quizService from '../services/quizService';
import guessService from '../services/guessService';
import { config } from '../config';

export const data = new SlashCommandBuilder()
  .setName('geoguess')
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
  try {
    const [quizes] = await quizService.getRunning();

    if (!quizes || quizes.length < 1) {
      return interaction.reply({
        content: 'There is no active quiz currently.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const quiz = quizes[0];
    const opts = interaction.options;
    const imgNumber = opts.getInteger('number');
    const x = opts.getNumber('x');
    const y = opts.getNumber('y');
    const zone = opts.getString('zone');

    if (!x || !y || !imgNumber || !zone) {
      return interaction.reply({
        content: 'Error, invalid input!',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!zones.includes(zone)) {
      return interaction.reply({
        content: 'Error, invalid zone name!',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (x.toString().length > 4 || y.toString().length > 4 || x < 0 || y < 0 || x > 40 || y > 40) {
      return interaction.reply({
        content: 'Invalid coordinate value',
        flags: MessageFlags.Ephemeral,
      });
    }

    // Check if user has already guessed for this specific quiz & image
    const hasGuessed = await guessService.hasGuessed(imgNumber, quiz.id, interaction.user.id);

    if (hasGuessed) {
      return interaction.reply({
        content: 'You have already guessed for that specific entry!',
        flags: MessageFlags.Ephemeral,
      });
    }

    const [images] = await imageService.getByIds(quiz.image_ids);

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

    if (config.GUILD_ID !== '913514320430780436' && img.discord_id === interaction.user.id) {
      return interaction.reply({
        content: 'You cannot guess on entries that you have uploaded',
        flags: MessageFlags.Ephemeral,
      });
    }

    // Correct answer
    if (
      x >= img.x - 2 &&
      x <= img.x + 2 &&
      y >= img.y - 2 &&
      y <= img.y + 2 &&
      img.zone.toLocaleLowerCase() === zone.toLocaleLowerCase()
    ) {
      const userId = interaction.member?.user.id;

      if (!userId) {
        return interaction.reply({
          content: 'Error, could not retrieve user Discord ID',
          flags: MessageFlags.Ephemeral,
        });
      }

      const [users] = await userService.getUser(interaction.member?.user.id);

      const member = interaction.member as GuildMember;

      if (!member) {
        return interaction.reply({
          content: `Error retrieving member info`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // New user
      if (!users[0]) {
        await userService.addUser(member.user.id, member.displayName);
      }
      // Update points on existing user
      else {
        await userService.updateUser(member.user.id, member.displayName);
      }

      await guessService.addGuess({
        discordId: interaction.user.id,
        quizId: quiz.id,
        imgNumber,
        image_id: img.id,
        correct: 1,
        zone,
        x,
        y,
      });

      if (!quiz.has_been_completed) {
        const [corrects] = await quizService.getCorrects(quiz.id);

        if (corrects && corrects[0]) {
          const ch = (await interaction.guild?.channels.fetch(config.CHANNEL_ID || '')) as TextChannel;

          if (!ch) {
            return;
          }

          const member = interaction.member as GuildMember;
          await ch.send(member.displayName + ' was the first one to guess all five correct! :tada:');
          await quizService.markCompleted(quiz.id);
        }
      }

      return interaction.reply({
        content: `Correct answer! :tada:`,
        flags: MessageFlags.Ephemeral,
      });
    }

    await guessService.addGuess({
      discordId: interaction.user.id,
      quizId: quiz.id,
      imgNumber,
      image_id: img.id,
      correct: 0,
      zone,
      x,
      y,
    });

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
