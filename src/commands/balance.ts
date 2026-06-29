import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Message,
    type CacheType,
} from 'discord.js';
import { IEconomyProvider } from '../types/Economy.js';
import { MineEmbedBuilder } from '../ui/MineEmbed.js';

export const data = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your current coin balance');

export async function execute(
    interaction: ChatInputCommandInteraction<CacheType>,
    economy: IEconomyProvider
): Promise<void> {
    const userId = interaction.user.id;
    const balance = await economy.getBalance(userId);

    await interaction.reply({
        embeds: [MineEmbedBuilder.buildBalanceEmbed(userId, balance)],
    });
}

export async function executePrefix(
    message: Message,
    args: string[],
    economy: IEconomyProvider
): Promise<void> {
    const userId = message.author.id;
    const balance = await economy.getBalance(userId);

    await message.reply({
        embeds: [MineEmbedBuilder.buildBalanceEmbed(userId, balance)],
    });
}
