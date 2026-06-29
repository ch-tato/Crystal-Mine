import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    type CacheType,
} from 'discord.js';
import { MongoEconomy } from '../database/MongoEconomy.js';
import { MineEmbedBuilder } from '../ui/MineEmbed.js';
import { logger } from '../utils/logger.js';
import { formatNumber } from '../utils/formatNumber.js';

/**
 * Returns true if the user is an authorized bot admin.
 * Admins are defined by the ADMIN_USER_IDS environment variable (comma-separated Discord user IDs).
 */
function isAdmin(userId: string): boolean {
    const adminIds = process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()) ?? [];
    return adminIds.includes(userId);
}

export const data = new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin commands for managing the Crystal Mine economy')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
        sub
            .setName('give')
            .setDescription('Give coins to a user')
            .addUserOption((opt) =>
                opt.setName('user').setDescription('The user to give coins to').setRequired(true)
            )
            .addIntegerOption((opt) =>
                opt
                    .setName('amount')
                    .setDescription('Amount of coins to give')
                    .setRequired(true)
                    .setMinValue(1)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName('set-balance')
            .setDescription('Set a user\'s balance to an exact amount')
            .addUserOption((opt) =>
                opt.setName('user').setDescription('The user to set balance for').setRequired(true)
            )
            .addIntegerOption((opt) =>
                opt
                    .setName('amount')
                    .setDescription('The new balance amount')
                    .setRequired(true)
                    .setMinValue(0)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName('reset')
            .setDescription('Reset a user\'s balance to the default starting amount')
            .addUserOption((opt) =>
                opt.setName('user').setDescription('The user to reset').setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName('check')
            .setDescription('Check any user\'s balance')
            .addUserOption((opt) =>
                opt.setName('user').setDescription('The user to check').setRequired(true)
            )
    );

export async function execute(
    interaction: ChatInputCommandInteraction<CacheType>,
    economy: MongoEconomy
): Promise<void> {
    if (!isAdmin(interaction.user.id)) {
        await interaction.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('You are not authorized to use admin commands.')],
            ephemeral: true,
        });
        return;
    }

    const subcommand = interaction.options.getSubcommand();

    try {
        switch (subcommand) {
            case 'give':
                await handleGive(interaction, economy);
                break;
            case 'set-balance':
                await handleSetBalance(interaction, economy);
                break;
            case 'reset':
                await handleReset(interaction, economy);
                break;
            case 'check':
                await handleCheck(interaction, economy);
                break;
            default:
                await interaction.reply({
                    embeds: [MineEmbedBuilder.buildErrorEmbed('Unknown subcommand.')],
                    ephemeral: true,
                });
        }
    } catch (error) {
        logger.error('AdminCommand', `Error in /admin ${subcommand}`, error);
        await interaction.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('An error occurred while executing the admin command.')],
            ephemeral: true,
        });
    }
}

async function handleGive(
    interaction: ChatInputCommandInteraction<CacheType>,
    economy: MongoEconomy
): Promise<void> {
    const targetUser = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);

    const newBalance = await economy.addCoins(targetUser.id, amount, 'Admin grant', 'admin');
    await economy.transactionLog({
        userId: targetUser.id,
        amount,
        type: 'refund',
        reason: `Admin grant by ${interaction.user.tag}`,
        timestamp: Date.now(),
        gameId: 'admin',
    });

    logger.info('AdminCommand', `${interaction.user.tag} gave ${amount} coins to ${targetUser.tag}`);

    await interaction.reply({
        embeds: [
            MineEmbedBuilder.buildSuccessEmbed(
                '🎁 Coins Given',
                `Gave **${formatNumber(amount)}** coins to ${targetUser}.\nNew balance: **${formatNumber(newBalance)}**`
            ),
        ],
    });
}

async function handleSetBalance(
    interaction: ChatInputCommandInteraction<CacheType>,
    economy: MongoEconomy
): Promise<void> {
    const targetUser = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);

    const newBalance = await economy.setBalance(targetUser.id, amount);

    logger.info('AdminCommand', `${interaction.user.tag} set balance of ${targetUser.tag} to ${amount}`);

    await interaction.reply({
        embeds: [
            MineEmbedBuilder.buildSuccessEmbed(
                '⚙️ Balance Set',
                `Set ${targetUser}'s balance to **${formatNumber(newBalance)}** coins.`
            ),
        ],
    });
}

async function handleReset(
    interaction: ChatInputCommandInteraction<CacheType>,
    economy: MongoEconomy
): Promise<void> {
    const targetUser = interaction.options.getUser('user', true);

    const newBalance = await economy.resetBalance(targetUser.id);

    logger.info('AdminCommand', `${interaction.user.tag} reset balance of ${targetUser.tag}`);

    await interaction.reply({
        embeds: [
            MineEmbedBuilder.buildSuccessEmbed(
                '🔄 Balance Reset',
                `Reset ${targetUser}'s balance to **${formatNumber(newBalance)}** coins.`
            ),
        ],
    });
}

async function handleCheck(
    interaction: ChatInputCommandInteraction<CacheType>,
    economy: MongoEconomy
): Promise<void> {
    const targetUser = interaction.options.getUser('user', true);
    const balance = await economy.getBalance(targetUser.id);

    await interaction.reply({
        embeds: [MineEmbedBuilder.buildBalanceEmbed(targetUser.id, balance)],
    });
}
