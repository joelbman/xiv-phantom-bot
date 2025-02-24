/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, TextChannel } from 'discord.js';
import { config } from './config';
import { commands } from './commands';
import { deployCommands } from './util/deploy-commands';
import quizService from './services/quizService';
import guessService from './services/guessService';

const client = new Client({
  intents: ['Guilds', 'GuildMessages'],
});

client.once('ready', async () => {
  console.log('Bot running');

  await guessService.markCorrect();

  setInterval(async () => {
    const [expiredQuizes] = await quizService.getExpired();

    if (expiredQuizes && expiredQuizes[0]) {
      const [update] = await quizService.stopQuiz(expiredQuizes[0].id);

      if (update.affectedRows && expiredQuizes[0].message_id) {
        const channel = (await client.channels.fetch(expiredQuizes[0].channel_id)) as TextChannel;
        const msg = await channel?.messages.fetch(expiredQuizes[0].message_id);
        if (msg) {
          await msg.delete();
        }
        if (channel) {
          return await channel.send('The running quiz has ended. Thanks for participating! :ok_hand:');
        }
      }
    }

    console.log('Checked running polls - ' + expiredQuizes.length + ' matches');
  }, 2600000);
  //3600000
});

client.on('guildCreate', async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;
    if (commands[commandName as keyof typeof commands]) {
      commands[commandName as keyof typeof commands].execute(interaction as any);
    }
    return;
  } else if (interaction.isAutocomplete()) {
    if (interaction.commandName !== 'geoguess' && interaction.commandName !== 'geoimage') {
      return;
    }

    try {
      await commands.geoguess.autocomplete(interaction);
    } catch (error) {
      console.error(error);
    }
  }
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

client.login(config.BOT_TOKEN);
