const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');
const mongoose = require('mongoose');
const { token, clientId, mongoUri } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

const deployCommands = async () => {
    const rest = new REST({ version: '10' }).setToken(token);
    try {
        console.log('Registering slash commands...');
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log('Slash commands registered.');
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
};

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing command:', error);
        await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
    }
});

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
};

mongoose.connect(mongoUri, options)
    .then(() => {
        console.log('Connected to MongoDB');
        deployCommands();
        client.login(token);
    })
    .catch(err => console.error('Failed to connect to MongoDB:', err));
