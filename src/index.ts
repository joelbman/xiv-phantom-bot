/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, TextChannel } from 'discord.js';
import { config } from './config';
import { commands } from './commands';
import { deployCommands } from './deploy-commands';
import { IQuiz } from './types';
import db from './db';

const client = new Client({
  intents: ['Guilds', 'GuildMessages'],
});

client.once('ready', async () => {
  console.log('Bot running');

  setInterval(async () => {
    const now = new Date(Date.now());
    const date = now.toISOString().slice(0, 19).replace('T', ' ');

    const [runningQuizes] = await db.execute<IQuiz[]>('SELECT * FROM xivgeo_quiz WHERE ends_at < ? AND running = 1', [
      date,
    ]);

    if (runningQuizes && runningQuizes[0]) {
      const [update] = await db.execute<any>('UPDATE xivgeo_quiz SET running = 0 WHERE id = ?', [runningQuizes[0].id]);

      if (update.affectedRows && runningQuizes[0].message_id) {
        const channel = (await client.channels.fetch(runningQuizes[0].channel_id)) as TextChannel;
        const msg = await channel?.messages.fetch(runningQuizes[0].message_id);
        if (msg) {
          await msg.delete();
        }
        return await channel.send('The running quiz has ended. Thanks for participating! :ok_hand:');
      }
    }

    console.log('Checked running polls - ' + runningQuizes.length + ' matches');
  }, 24000);
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
