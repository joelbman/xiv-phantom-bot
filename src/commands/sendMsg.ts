import { ChannelType, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, TextChannel } from 'discord.js';
import { permissionCheck } from '../util/interactionHelpers';

export const data = new SlashCommandBuilder()
  .setName('sendmsg')
  .setDescription('Sends a message through the bot')
  .addChannelOption((option) =>
    option.setName('channel').setDescription('Channel').setRequired(true).addChannelTypes(ChannelType.GuildText)
  )
  .addStringOption((option) => option.setName('message').setDescription('Message').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const perms = await permissionCheck(interaction);
  if (perms !== true) {
    return;
  }

  try {
    const chan = interaction.client.channels.cache.get(
      interaction.options?.getChannel('channel')?.id || ''
    ) as TextChannel;

    chan.send(interaction.options.getString('message') || '');

    return interaction.reply({ content: 'Sent :ok_hand:', flags: MessageFlags.Ephemeral });
  } catch (e) {
    console.error(e);
    interaction.reply({ content: 'Error!', flags: MessageFlags.Ephemeral });
  }
}
