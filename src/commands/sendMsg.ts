import {
  ChannelType,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('sendmsg')
  .setDescription('Sends a message through the bot')
  .addChannelOption((option) =>
    option.setName('channel').setDescription('Channel').setRequired(true).addChannelTypes(ChannelType.GuildText)
  )
  .addStringOption((option) => option.setName('message').setDescription('Message').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(interaction.member?.permissions as PermissionsBitField).has([PermissionsBitField.Flags.KickMembers])) {
    return await interaction.reply({
      content: 'Permission denied',
      flags: MessageFlags.Ephemeral,
    });
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
