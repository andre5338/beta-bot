const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('Economy commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('Check your balance'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('work')
                .setDescription('Work to earn money'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('daily')
                .setDescription('Claim your daily reward'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('deposit')
                .setDescription('Deposit money into your bank')
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount to deposit')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('withdraw')
                .setDescription('Withdraw money from your bank')
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount to withdraw')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('gamble')
                .setDescription('Gamble your money')
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount to gamble')
                        .setRequired(true)))
            .setDMPermission(false),
   
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = await User.findOne({ userId: interaction.user.id }) || new User({ userId: interaction.user.id });
        const now = new Date();

        if (subcommand === 'balance') {
            const balanceEmbed = new EmbedBuilder()
                .setTitle('Your Balance')
                .setDescription(`Balance: $${user.balance}\nBank: $${user.bank}`)
                .setColor(0x00ff10);
            await interaction.reply({ embeds: [balanceEmbed] });

        } else if (subcommand === 'work') {
            const workCooldown = 60 * 60 * 1000; // This is for Cooldown
            if (user.lastWork && now - user.lastWork < workCooldown) {
                const timeLeft = Math.ceil((workCooldown - (now - user.lastWork)) / 60000);
                await interaction.reply({ content: `You need to wait ${timeLeft} more minutes to work again.`, ephemeral: true });
                return;
            }
            const earned = Math.floor(Math.random() * 100) + 1;
            user.balance += earned;
            user.lastWork = now;
            await user.save();
            const workEmbed = new EmbedBuilder()
                .setTitle('Work')
                .setDescription(`You earned $${earned}. Your new balance is $${user.balance}.`)
                .setColor(0x00ff10);
            await interaction.reply({ embeds: [workEmbed] });

        } else if (subcommand === 'daily') {
            const dailyCooldown = 24 * 60 * 60 * 1000; // This is for Cooldown
            if (user.lastDaily && now - user.lastDaily < dailyCooldown) {
                const hoursLeft = Math.ceil((dailyCooldown - (now - user.lastDaily)) / (60 * 60 * 1000));
                await interaction.reply({ content: `You need to wait ${hoursLeft} more hours to claim your daily reward again.`, ephemeral: true });
                return;
            }
            const dailyAmount = 50;
            user.balance += dailyAmount;
            user.lastDaily = now;
            await user.save();
            const dailyEmbed = new EmbedBuilder()
                .setTitle('Daily Reward')
                .setDescription(`You claimed your daily reward of $${dailyAmount}. Your new balance is $${user.balance}.`)
                .setColor(0xffff00);
            await interaction.reply({ embeds: [dailyEmbed] });

        } else if (subcommand === 'deposit') {
            const depositAmount = interaction.options.getNumber('amount');
            if (depositAmount <= 0) {
                await interaction.reply({ content: 'You must deposit a positive amount.', ephemeral: true });
                return;
            }
            if (user.balance < depositAmount) {
                await interaction.reply({ content: 'You do not have enough balance to deposit this amount.', ephemeral: true });
                return;
            }
            user.balance -= depositAmount;
            user.bank += depositAmount;
            await user.save();
            const depositEmbed = new EmbedBuilder()
                .setTitle('Deposit Successful')
                .setDescription(`You deposited $${depositAmount}. Your new balance is $${user.balance}.`)
                .setColor(0x00ff10);
            await interaction.reply({ embeds: [depositEmbed] });

        } else if (subcommand === 'withdraw') {
            const withdrawAmount = interaction.options.getNumber('amount');
            if (withdrawAmount <= 0) {
                await interaction.reply({ content: 'You must withdraw a positive amount.', ephemeral: true });
                return;
            }
            if (user.bank < withdrawAmount) {
                await interaction.reply({ content: 'You do not have enough funds in your bank.', ephemeral: true });
                return;
            }
            user.bank -= withdrawAmount;
            user.balance += withdrawAmount;
            await user.save();
            const withdrawEmbed = new EmbedBuilder()
                .setTitle('Withdrawal Successful')
                .setDescription(`You withdrew $${withdrawAmount}. Your new balance is $${user.balance}.`)
                .setColor(0x00ff10);
            await interaction.reply({ embeds: [withdrawEmbed] });

        } else if (subcommand === 'gamble') {
            const gambleAmount = interaction.options.getNumber('amount');
            if (gambleAmount <= 0) {
                await interaction.reply({ content: 'You must gamble a positive amount.', ephemeral: true });
                return;
            }
            if (user.balance < gambleAmount) {
                await interaction.reply({ content: 'You do not have enough balance to gamble this amount.', ephemeral: true });
                return;
            }
            const win = Math.random() < 0.5;
            if (win) {
                user.balance += gambleAmount;
                await user.save();
                await interaction.reply({ embeds: [new EmbedBuilder().setTitle('You Won!').setDescription(`You gambled $${gambleAmount} and won! Your new balance is $${user.balance}.`).setColor(0x00ff10)] });
            } else {
                user.balance -= gambleAmount;
                await user.save();
                await interaction.reply({ embeds: [
                    new EmbedBuilder()
                    .setTitle('You Lost!')
                    .setDescription(`You gambled $${gambleAmount} and lost. Your new balance is $${user.balance}.`)
                    .setColor(0xff0000)
                ]
                                        });
            }
        }
    }
};
