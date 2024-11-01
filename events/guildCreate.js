const { Events } = require('discord.js');

const AllowedServers = require('../models/AllowedServers');

module.exports = {

    name: Events.GuildCreate,

    /**

     * @param {import('discord.js').Guild} guild

     */

    async execute(guild) {

        const allowed = await AllowedServers.findOne({ guildId: guild.id });

        if (!allowed) {

            const owner = await guild.fetchOwner();

            try {

                await owner.send(

                    `🚫 Your server \`${guild.name}\` is not on the allowed list. Please contact .andre53 to request access.`

                );

            } catch (err) {

                console.error(`Could not send DM to the owner of ${guild.name}:`);

            }

            await guild.leave();

        } else {

            console.log(`Joined allowed guild: ${guild.name} (${guild.id})`);

        }

    }

};
