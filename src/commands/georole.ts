import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder().setName('georole').setDescription('Toggles the GeoGuess role on you');

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const role = interaction.guild?.roles.cache.find((role) => role.name === 'GeoGuess');
    const guild = interaction.guild;
    const member = guild?.members.cache.get(interaction.user.id);

    if (!role) {
      return;
    }

    console.log(member);

    if (member?.roles.cache.has(role?.id)) {
      await interaction.guild?.members.removeRole({ user: interaction.user.id, role: role.id });
      return interaction.reply({ content: 'Role removed :ok_hand:', flags: MessageFlags.Ephemeral });
    }

    await interaction.guild?.members.addRole({ user: interaction.user.id, role: role.id });
    return interaction.reply({ content: 'Role given :ok_hand:', flags: MessageFlags.Ephemeral });
  } catch (e) {
    console.error(e);
    interaction.reply({ content: 'Error!', flags: MessageFlags.Ephemeral });
  }
}
