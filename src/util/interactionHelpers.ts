import { ChatInputCommandInteraction, MessageFlags, PermissionsBitField } from 'discord.js';

export const permissionCheck = async (interaction: ChatInputCommandInteraction) => {
  if (!(interaction.member?.permissions as PermissionsBitField).has([PermissionsBitField.Flags.KickMembers])) {
    return await interaction.reply({
      content: 'Permission denied',
      flags: MessageFlags.Ephemeral,
    });
  }
  return true;
};
