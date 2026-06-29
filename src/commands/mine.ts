import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Message,
    type CacheType,
} from 'discord.js';
import { GameManager } from '../game/GameManager.js';
import { IEconomyProvider } from '../types/Economy.js';
import { MineEmbedBuilder } from '../ui/MineEmbed.js';
import { MineButtonBuilder } from '../ui/MineButtons.js';
import { logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
    .setName('mine')
    .setDescription('Start a Crystal Mine game — find crystals, avoid bombs!')
    .addIntegerOption((option) =>
        option
            .setName('bet')
            .setDescription('Amount of coins to bet')
            .setRequired(true)
            .setMinValue(100)
            .setMaxValue(1_000_000)
    );

export async function execute(
    interaction: ChatInputCommandInteraction<CacheType>,
    gameManager: GameManager
): Promise<void> {
    const bet = interaction.options.getInteger('bet', true);
    const playerId = interaction.user.id;

    const result = await gameManager.startGame(playerId, bet);

    if (!result.success) {
        await interaction.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed(result.reason)],
            ephemeral: true,
        });
        return;
    }

    const { game, state } = result;

    const embed = MineEmbedBuilder.buildGameEmbed(state);
    const buttons = MineButtonBuilder.buildGameButtons(state);

    const reply = await interaction.reply({
        embeds: [embed],
        components: buttons,
        fetchReply: true,
    });

    game.setMessageId(reply.id);
    game.setChannelId(reply.channelId);

    logger.info('MineCommand', `Game started`, {
        playerId,
        gameId: game.getGameId(),
        bet,
        messageId: reply.id,
    });
}

export async function executePrefix(
    message: Message,
    args: string[],
    gameManager: GameManager,
    economy: IEconomyProvider
): Promise<void> {
    if (args.length < 1) {
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('Please provide a bet amount. Usage: `cmmine <amount>`')],
        });
        return;
    }

    const playerId = message.author.id;
    let bet: number;

    if (args[0].toLowerCase() === 'all') {
        const balance = await economy.getBalance(playerId);
        if (balance <= 0) {
            await message.reply({
                embeds: [MineEmbedBuilder.buildErrorEmbed('You have no coins to bet!')],
            });
            return;
        }
        // Cap the 'all in' bet to the maximum allowed (1,000,000)
        bet = Math.min(balance, 1_000_000);
    } else {
        bet = parseInt(args[0], 10);
        if (isNaN(bet)) {
            await message.reply({
                embeds: [MineEmbedBuilder.buildErrorEmbed('Invalid bet amount. Provide a number or `all`.')],
            });
            return;
        }
    }
    const result = await gameManager.startGame(playerId, bet);

    if (!result.success) {
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed(result.reason)],
        });
        return;
    }

    const { game, state } = result;

    const embed = MineEmbedBuilder.buildGameEmbed(state);
    const buttons = MineButtonBuilder.buildGameButtons(state);

    const reply = await message.reply({
        embeds: [embed],
        components: buttons,
    });

    game.setMessageId(reply.id);
    game.setChannelId(reply.channelId);

    logger.info('MineCommand', `Game started via prefix`, {
        playerId,
        gameId: game.getGameId(),
        bet,
        messageId: reply.id,
    });
}
