import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Message,
    type CacheType,
} from 'discord.js';
import { IEconomyProvider } from '../types/Economy.js';
import { MineEmbedBuilder } from '../ui/MineEmbed.js';
import { formatNumber } from '../utils/formatNumber.js';
import { logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
    .setName('give')
    .setDescription('Give coins to another user')
    .addUserOption((option) =>
        option
            .setName('user')
            .setDescription('The user you want to give coins to')
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName('amount')
            .setDescription('The amount of coins to give')
            .setRequired(true)
            .setMinValue(1)
    );

export async function execute(
    interaction: ChatInputCommandInteraction<CacheType>,
    economy: IEconomyProvider
): Promise<void> {
    const targetUser = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);
    const senderId = interaction.user.id;

    if (targetUser.id === senderId) {
        await interaction.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('You cannot give coins to yourself.')],
            ephemeral: true,
        });
        return;
    }

    if (targetUser.bot) {
        await interaction.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('You cannot give coins to a bot.')],
            ephemeral: true,
        });
        return;
    }

    try {
        const senderBalance = await economy.getBalance(senderId);

        if (senderBalance < amount) {
            await interaction.reply({
                embeds: [
                    MineEmbedBuilder.buildErrorEmbed(
                        `Insufficient balance. You have **${formatNumber(
                            senderBalance
                        )}** coins but tried to give **${formatNumber(amount)}**.`
                    ),
                ],
                ephemeral: true,
            });
            return;
        }

        // Remove from sender, add to target
        await economy.removeCoins(senderId, amount, 'User to User transfer (give)', 'transfer');
        await economy.addCoins(targetUser.id, amount, 'User to User transfer (receive)', 'transfer');

        // Log transaction for sender
        await economy.transactionLog({
            userId: senderId,
            amount,
            type: 'bet', // Treat it like an expense in the log
            reason: `Gave coins to ${targetUser.tag}`,
            timestamp: Date.now(),
            gameId: 'transfer',
        });

        // Log transaction for receiver
        await economy.transactionLog({
            userId: targetUser.id,
            amount,
            type: 'win', // Treat it like income in the log
            reason: `Received coins from ${interaction.user.tag}`,
            timestamp: Date.now(),
            gameId: 'transfer',
        });

        logger.info(
            'GiveCommand',
            `${interaction.user.tag} gave ${amount} coins to ${targetUser.tag}`
        );

        await interaction.reply({
            embeds: [
                MineEmbedBuilder.buildSuccessEmbed(
                    '💸 Transfer Successful',
                    `You have successfully transferred **${formatNumber(amount)}** coins to ${targetUser}.`
                ),
            ],
        });
    } catch (error) {
        logger.error('GiveCommand', 'Error processing coin transfer', error);
        await interaction.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('An error occurred during the transfer.')],
            ephemeral: true,
        });
    }
}

export async function executePrefix(
    message: Message,
    args: string[],
    economy: IEconomyProvider
): Promise<void> {
    if (args.length < 2) {
        await message.reply({
            embeds: [
                MineEmbedBuilder.buildErrorEmbed(
                    'Please provide a user and an amount. Usage: `cmgive @user <amount>`'
                ),
            ],
        });
        return;
    }

    // Parse the user mention: <@123456789> or <@!123456789>
    const mentionRegex = /^<@!?(\d+)>$/;
    const match = args[0].match(mentionRegex);

    if (!match) {
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('Invalid user format. Please @mention the user.')],
        });
        return;
    }

    const targetUserId = match[1];
    const amount = parseInt(args[1], 10);

    if (isNaN(amount) || amount < 1) {
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('Please provide a valid, positive coin amount.')],
        });
        return;
    }

    const senderId = message.author.id;

    if (targetUserId === senderId) {
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('You cannot give coins to yourself.')],
        });
        return;
    }

    // Ensure target isn't a bot (if possible to fetch quickly, else skip this check for prefix)
    const targetUser = message.mentions.users.get(targetUserId);
    if (targetUser?.bot) {
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('You cannot give coins to a bot.')],
        });
        return;
    }

    try {
        const senderBalance = await economy.getBalance(senderId);

        if (senderBalance < amount) {
            await message.reply({
                embeds: [
                    MineEmbedBuilder.buildErrorEmbed(
                        `Insufficient balance. You have **${formatNumber(
                            senderBalance
                        )}** coins but tried to give **${formatNumber(amount)}**.`
                    ),
                ],
            });
            return;
        }

        // Remove from sender, add to target
        await economy.removeCoins(senderId, amount, 'User to User transfer (give)', 'transfer');
        await economy.addCoins(targetUserId, amount, 'User to User transfer (receive)', 'transfer');

        // Log transaction for sender
        await economy.transactionLog({
            userId: senderId,
            amount,
            type: 'bet',
            reason: `Gave coins to user ${targetUserId}`,
            timestamp: Date.now(),
            gameId: 'transfer',
        });

        // Log transaction for receiver
        await economy.transactionLog({
            userId: targetUserId,
            amount,
            type: 'win',
            reason: `Received coins from user ${senderId}`,
            timestamp: Date.now(),
            gameId: 'transfer',
        });

        const targetTag = targetUser ? targetUser.tag : `<@${targetUserId}>`;
        logger.info('GiveCommand', `${message.author.tag} gave ${amount} coins to ${targetTag}`);

        await message.reply({
            embeds: [
                MineEmbedBuilder.buildSuccessEmbed(
                    '💸 Transfer Successful',
                    `You have successfully transferred **${formatNumber(amount)}** coins to <@${targetUserId}>.`
                ),
            ],
        });
    } catch (error) {
        logger.error('GiveCommand', 'Error processing coin transfer via prefix', error);
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('An error occurred during the transfer.')],
        });
    }
}
