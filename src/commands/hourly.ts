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

const HOURLY_REWARD = 1000;

export const data = new SlashCommandBuilder()
    .setName('hourly')
    .setDescription(`Claim your hourly reward of ${HOURLY_REWARD} coins!`);

function buildHourlyResultEmbed(result: { success: boolean; newBalance?: number; timeRemainingMs?: number }): any {
    if (result.success) {
        return MineEmbedBuilder.buildSuccessEmbed(
            '🎁 Hourly Reward Claimed!',
            `You have claimed your **${formatNumber(HOURLY_REWARD)}** coins!\nYour new balance is **${formatNumber(result.newBalance!)}** coins.`
        );
    } else {
        const remainingMinutes = Math.ceil(result.timeRemainingMs! / 1000 / 60);
        return MineEmbedBuilder.buildErrorEmbed(
            `You have already claimed your hourly reward. Please wait **${remainingMinutes} minute(s)** before claiming again.`
        );
    }
}

export async function execute(
    interaction: ChatInputCommandInteraction<CacheType>,
    economy: IEconomyProvider
): Promise<void> {
    try {
        const userId = interaction.user.id;
        const result = await economy.claimHourly(userId, HOURLY_REWARD);

        if (result.success) {
            await economy.transactionLog({
                userId,
                amount: HOURLY_REWARD,
                type: 'win',
                reason: 'Hourly Reward Claim',
                timestamp: Date.now(),
                gameId: 'hourly',
            });
            logger.info('HourlyCommand', `${interaction.user.tag} claimed their hourly reward`);
        }

        await interaction.reply({
            embeds: [buildHourlyResultEmbed(result)],
        });
    } catch (error) {
        logger.error('HourlyCommand', 'Error processing hourly claim', error);
        await interaction.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('An error occurred during the claim process.')],
            ephemeral: true,
        });
    }
}

export async function executePrefix(
    message: Message,
    args: string[],
    economy: IEconomyProvider
): Promise<void> {
    try {
        const userId = message.author.id;
        const result = await economy.claimHourly(userId, HOURLY_REWARD);

        if (result.success) {
            await economy.transactionLog({
                userId,
                amount: HOURLY_REWARD,
                type: 'win',
                reason: 'Hourly Reward Claim',
                timestamp: Date.now(),
                gameId: 'hourly',
            });
            logger.info('HourlyCommand', `${message.author.tag} claimed their hourly reward via prefix`);
        }

        await message.reply({
            embeds: [buildHourlyResultEmbed(result)],
        });
    } catch (error) {
        logger.error('HourlyCommand', 'Error processing hourly claim via prefix', error);
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('An error occurred during the claim process.')],
        });
    }
}
