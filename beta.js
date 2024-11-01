const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AllowedServers = require('../models/AllowedServers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('beta')
        .setDescription('Manage allowed servers.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a server to the allowed list')
                .addStringOption(option =>
                    option.setName('guild_id')
                        .setDescription('The ID of the guild to allow (numbers only)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a server from the allowed list')
                .addStringOption(option =>
                    option.setName('guild_id')
                        .setDescription('The ID of the guild to disallow (numbers only)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all allowed servers with details'))
        .setDMPermission(false),

    async execute(interaction) {
        const allowedUserId = '1180501233669242920';

        if (interaction.user.id !== allowedUserId) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setDescription("❌ You do not have permission to use this command.").setColor(0xff0000)],
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.options.getString('guild_id');

        if (guildId && !/^\d+$/.test(guildId)) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setDescription("❌ The `guild_id` must contain numbers only.").setColor(0xff0000)],
                ephemeral: true
            });
        }

        try {
            if (subcommand === 'add') {
                const exists = await AllowedServers.findOne({ guildId });
                if (exists) {
                    return interaction.reply({
                        embeds: [new EmbedBuilder().setDescription(`❌ Server \`${guildId}\` is already in the allowed list.`).setColor(0xff0000)],
                        ephemeral: true
                    });
                }

                await AllowedServers.create({ guildId });
                return interaction.reply({
                    embeds: [new EmbedBuilder().setDescription(`✅ Server \`${guildId}\` has been added to the allowed list.`).setColor(0x00ff10)],
                    ephemeral: true
                });
            }

            if (subcommand === 'remove') {
                const exists = await AllowedServers.findOne({ guildId });
                if (!exists) {
                    return interaction.reply({
                        embeds: [new EmbedBuilder().setDescription(`❌ Server \`${guildId}\` is not in the allowed list.`).setColor(0xff0000)],
                        ephemeral: true
                    });
                }

                await AllowedServers.deleteOne({ guildId });
                return interaction.reply({
                    embeds: [new EmbedBuilder().setDescription(`✅ Server \`${guildId}\` has been removed from the allowed list.`).setColor(0xff0000)],
                    ephemeral: true
                });
            }

            if (subcommand === 'list') {
                const allowedServers = await AllowedServers.find({});
                if (allowedServers.length === 0) {
                    return interaction.reply({
                        embeds: [new EmbedBuilder().setDescription('❌ There are no servers in the allowed list.').setColor(0xff0000)],
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder().setTitle('Allowed Servers').setColor(0x00ff10);
                const guildFetchPromises = allowedServers.map(async (server) => {
                    const guild = await interaction.client.guilds.fetch(server.guildId).catch(() => null);
                    if (!guild) return null;

                    const owner = await guild.fetchOwner().catch(() => null);
                    const channels = await guild.channels.fetch().catch(() => []);
                    const invite = await guild.invites.create(channels.first(), { maxAge: 0, maxUses: 1 }).catch(() => 'No Invite');

                    return {
                        name: `${guild.name} (${guild.id})`,
                        value: `Owner: ${owner?.user.tag || 'Unknown'} (${owner?.id || 'Unknown'})\nMembers: ${guild.memberCount}\nInvite: ${invite}`
                    };
                });

                const results = await Promise.all(guildFetchPromises);
                results.forEach(result => {
                    if (result) embed.addFields(result);
                });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            console.error('Error executing command:', error);
            return interaction.reply({
                embeds: [new EmbedBuilder().setDescription('❌ An error occurred while processing your request.').setColor(0xff0000)],
                ephemeral: true
            });
        }
    }
};
