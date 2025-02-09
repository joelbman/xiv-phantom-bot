/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from 'discord.js';
import { config } from './config';
import { commands } from './commands';
import { deployCommands } from './deploy-commands';

const client = new Client({
  intents: ['Guilds', 'GuildMessages'],
});

client.once('ready', async () => {
  console.log('Bot running');
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
    if (interaction.commandName !== 'guess' && interaction.commandName !== 'addimage') {
      return;
    }

    try {
      await commands.guess.autocomplete(interaction);
    } catch (error) {
      console.error(error);
    }
  }
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

client.login(config.BOT_TOKEN);
