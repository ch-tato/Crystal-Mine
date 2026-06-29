import {
    Interaction,
    ButtonInteraction,
    type CacheType,
} from 'discord.js';
import { GameManager } from '../game/GameManager.js';
import { GameStatus, GameState } from '../types/GameState.js';
import { MineEmbedBuilder } from '../ui/MineEmbed.js';
import { MineButtonBuilder } from '../ui/MineButtons.js';
import { logger } from '../utils/logger.js';

/**
 * Parses a mine button custom ID.
 * Formats:
 *   mine_tile_{position}_{gameId}
 *   mine_cashout_{gameId}
 */
function parseCustomId(customId: string): {
    type: 'tile' | 'cashout';
    position?: number;
    gameId: string;
} | null {
    if (customId.startsWith('mine_tile_')) {
        const parts = customId.split('_');
        if (parts.length < 4) return null;
        const position = parseInt(parts[2], 10);
        const gameId = parts.slice(3).join('_');
        if (isNaN(position)) return null;
        return { type: 'tile', position, gameId };
    }

    if (customId.startsWith('mine_cashout_')) {
        const gameId = customId.slice('mine_cashout_'.length);
        return { type: 'cashout', gameId };
    }

    return null;
}

export function createInteractionHandler(gameManager: GameManager) {
    return async function handleInteraction(interaction: Interaction<CacheType>): Promise<void> {
        if (!interaction.isButton()) return;

        const parsed = parseCustomId(interaction.customId);
        if (!parsed) return;

        const buttonInteraction = interaction as ButtonInteraction<CacheType>;
        const playerId = buttonInteraction.user.id;

        // Security: verify this is the game owner
        const game = gameManager.getGame(playerId);

        if (!game) {
            // The clicker has no active game — either it's not their game or it ended
            await buttonInteraction.reply({
                embeds: [MineEmbedBuilder.buildErrorEmbed("This isn't your game.")],
                ephemeral: true,
            });
            return;
        }

        // Verify the game ID matches the button's game ID
        if (game.getGameId() !== parsed.gameId) {
            await buttonInteraction.reply({
                embeds: [MineEmbedBuilder.buildErrorEmbed('This game is no longer active.')],
                ephemeral: true,
            });
            return;
        }

        if (!game.isActive()) {
            await buttonInteraction.reply({
                embeds: [MineEmbedBuilder.buildErrorEmbed('This game has already ended.')],
                ephemeral: true,
            });
            return;
        }

        try {
            if (parsed.type === 'tile' && parsed.position !== undefined) {
                await handleTileClick(buttonInteraction, gameManager, playerId, parsed.position);
            } else if (parsed.type === 'cashout') {
                await handleCashOut(buttonInteraction, gameManager, playerId);
            }
        } catch (error) {
            logger.error('InteractionHandler', 'Error handling button interaction', error);

            if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                await buttonInteraction.reply({
                    embeds: [MineEmbedBuilder.buildErrorEmbed('An internal error occurred. Please try again.')],
                    ephemeral: true,
                });
            }
        }
    };
}

async function handleTileClick(
    interaction: ButtonInteraction<CacheType>,
    gameManager: GameManager,
    playerId: string,
    position: number
): Promise<void> {
    // Capture state snapshot from the MineGame BEFORE revealTile
    // (revealTile may end the game and remove it from the manager)
    const game = gameManager.getGame(playerId)!;

    const result = gameManager.revealTile(playerId, position);

    // Get the final state directly from the game object
    // (the object still exists even if removed from the map)
    const finalState: GameState = game.getState();

    if (result.status === GameStatus.Lost) {
        await interaction.update({
            embeds: [MineEmbedBuilder.buildLoseEmbed(finalState)],
            components: MineButtonBuilder.buildEndedButtons(finalState),
        });

        logger.info('InteractionHandler', `Player ${playerId} hit a bomb`, { position });
        return;
    }

    // Safe tile revealed — update the display
    await interaction.update({
        embeds: [MineEmbedBuilder.buildGameEmbed(finalState)],
        components: MineButtonBuilder.buildGameButtons(finalState),
    });

    logger.info('InteractionHandler', `Player ${playerId} revealed crystal`, {
        position,
        multiplier: result.multiplier,
    });
}

async function handleCashOut(
    interaction: ButtonInteraction<CacheType>,
    gameManager: GameManager,
    playerId: string
): Promise<void> {
    // Capture reference to the game before cashOut removes it from the map
    const game = gameManager.getGame(playerId)!;

    const result = await gameManager.cashOut(playerId);

    // Get the final state from the game object (still valid after removal from map)
    const finalState: GameState = game.getState();

    await interaction.update({
        embeds: [MineEmbedBuilder.buildWinEmbed(finalState, result.payout)],
        components: MineButtonBuilder.buildEndedButtons(finalState),
    });

    logger.info('InteractionHandler', `Player ${playerId} cashed out`, {
        payout: result.payout,
        multiplier: result.multiplier,
    });
}
