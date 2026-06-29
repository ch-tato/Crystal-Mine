import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    type CacheType,
} from 'discord.js';
import { GameManager } from '../game/GameManager.js';
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
