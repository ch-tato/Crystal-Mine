import { EmbedBuilder } from 'discord.js';
import { GameState, GameStatus, TileState } from '../types/GameState.js';
import { formatNumber, formatMultiplier, formatCoins } from '../utils/formatNumber.js';

const EMOJI = {
    hidden: '⬛',
    crystal: '💎',
    bomb: '💣',
    disabled: '⬜',
    cashOut: '💰',
    coin: '🪙',
    trophy: '🏆',
    skull: '💀',
    clock: '⏰',
    pickaxe: '⛏️',
    chart: '📊',
} as const;

const COLORS = {
    active: 0xf5a623,     // Gold
    won: 0x43b581,        // Green
    lost: 0xf04747,       // Red
    expired: 0x747f8d,    // Gray
    error: 0xf04747,      // Red
    info: 0x5865f2,       // Blurple
} as const;

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━━';

function renderBoard(state: GameState): string {
    const lines: string[] = [];
    const { board, boardSize } = state;

    for (let row = 0; row < boardSize; row++) {
        const rowTiles: string[] = [];
        for (let col = 0; col < boardSize; col++) {
            const tile = board[row * boardSize + col];
            switch (tile.state) {
                case TileState.Hidden:
                    rowTiles.push(EMOJI.hidden);
                    break;
                case TileState.RevealedSafe:
                    rowTiles.push(EMOJI.crystal);
                    break;
                case TileState.RevealedBomb:
                    rowTiles.push(EMOJI.bomb);
                    break;
                case TileState.Disabled:
                    rowTiles.push(EMOJI.disabled);
                    break;
            }
        }
        lines.push(rowTiles.join(' '));
    }

    return lines.join('\n');
}

export class MineEmbedBuilder {
    /**
     * Builds the main game embed shown during active gameplay.
     */
    static buildGameEmbed(state: GameState): EmbedBuilder {
        const boardDisplay = renderBoard(state);

        return new EmbedBuilder()
            .setColor(COLORS.active)
            .setTitle(`${EMOJI.pickaxe} Crystal Mine`)
            .setDescription(
                [
                    DIVIDER,
                    '',
                    `${EMOJI.coin} **Bet:** ${formatNumber(state.bet)}`,
                    `${EMOJI.bomb} **Bombs:** ${state.bombCount}`,
                    `${EMOJI.chart} **Multiplier:** ${formatMultiplier(state.multiplier)}`,
                    `${EMOJI.trophy} **Potential Win:** ${formatNumber(state.potentialPayout)}`,
                    '',
                    DIVIDER,
                    '',
                    boardDisplay,
                    '',
                    DIVIDER,
                ].join('\n')
            )
            .setFooter({
                text: `Revealed: ${state.revealedCount} | Safe tiles remaining: ${state.boardSize * state.boardSize - state.bombCount - state.revealedCount}`,
            })
            .setTimestamp();
    }

    /**
     * Builds the win embed when a player cashes out.
     */
    static buildWinEmbed(state: GameState, payout: number): EmbedBuilder {
        const boardDisplay = renderBoard(state);
        const profit = payout - state.bet;

        return new EmbedBuilder()
            .setColor(COLORS.won)
            .setTitle(`${EMOJI.trophy} You Won!`)
            .setDescription(
                [
                    DIVIDER,
                    '',
                    `${EMOJI.coin} **Bet:** ${formatNumber(state.bet)}`,
                    `${EMOJI.chart} **Multiplier:** ${formatMultiplier(state.multiplier)}`,
                    `${EMOJI.cashOut} **Payout:** ${formatNumber(payout)}`,
                    `📈 **Profit:** +${formatNumber(profit)}`,
                    '',
                    DIVIDER,
                    '',
                    boardDisplay,
                    '',
                    DIVIDER,
                ].join('\n')
            )
            .setFooter({
                text: `Crystals found: ${state.revealedCount} | Game ID: ${state.gameId.slice(0, 8)}`,
            })
            .setTimestamp();
    }

    /**
     * Builds the loss embed when a player hits a bomb.
     */
    static buildLoseEmbed(state: GameState): EmbedBuilder {
        const boardDisplay = renderBoard(state);

        return new EmbedBuilder()
            .setColor(COLORS.lost)
            .setTitle(`${EMOJI.skull} Boom! You Lost!`)
            .setDescription(
                [
                    DIVIDER,
                    '',
                    `${EMOJI.coin} **Bet:** ${formatNumber(state.bet)}`,
                    `${EMOJI.bomb} **You hit a bomb!**`,
                    `💸 **Lost:** -${formatNumber(state.bet)}`,
                    '',
                    DIVIDER,
                    '',
                    boardDisplay,
                    '',
                    DIVIDER,
                ].join('\n')
            )
            .setFooter({
                text: `Crystals found: ${state.revealedCount} | Game ID: ${state.gameId.slice(0, 8)}`,
            })
            .setTimestamp();
    }

    /**
     * Builds the expired embed when a game times out.
     */
    static buildExpiredEmbed(state: GameState): EmbedBuilder {
        const boardDisplay = renderBoard(state);

        return new EmbedBuilder()
            .setColor(COLORS.expired)
            .setTitle(`${EMOJI.clock} Game Expired`)
            .setDescription(
                [
                    DIVIDER,
                    '',
                    `${EMOJI.coin} **Bet:** ${formatNumber(state.bet)}`,
                    `⏳ **The game timed out.**`,
                    `💸 **Lost:** -${formatNumber(state.bet)}`,
                    '',
                    DIVIDER,
                    '',
                    boardDisplay,
                    '',
                    DIVIDER,
                ].join('\n')
            )
            .setFooter({
                text: `Game expired after ${state.timeoutMs / 1000}s | Game ID: ${state.gameId.slice(0, 8)}`,
            })
            .setTimestamp();
    }

    /**
     * Builds a generic error embed.
     */
    static buildErrorEmbed(message: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(COLORS.error)
            .setTitle('❌ Error')
            .setDescription(message)
            .setTimestamp();
    }

    /**
     * Builds a balance display embed.
     */
    static buildBalanceEmbed(userId: string, balance: number): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(COLORS.info)
            .setTitle(`${EMOJI.coin} Balance`)
            .setDescription(
                [
                    DIVIDER,
                    '',
                    `**Your Balance:** ${formatCoins(balance)}`,
                    '',
                    DIVIDER,
                ].join('\n')
            )
            .setFooter({ text: `User ID: ${userId}` })
            .setTimestamp();
    }

    /**
     * Builds a generic success embed (used by admin commands).
     */
    static buildSuccessEmbed(title: string, description: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(COLORS.won)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();
    }

    /**
     * Builds a generic info embed.
     */
    static buildInfoEmbed(title: string, description: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(COLORS.info)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();
    }

    /**
     * Builds a generic expired message embed.
     */
    static buildExpiredMessageEmbed(message: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(COLORS.expired)
            .setTitle(`${EMOJI.clock} Time's Up`)
            .setDescription(message)
            .setTimestamp();
    }

    /**
     * Builds the help embed listing all commands.
     */
    static buildHelpEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(COLORS.info)
            .setTitle(`${EMOJI.pickaxe} Crystal Mine Commands`)
            .setDescription(
                [
                    'Here are all the available commands you can use:',
                    '',
                    '**Slash Commands**',
                    '`/mine bet:<amount>` - Start a game with the specified bet.',
                    '`/balance` - Check your current coin balance.',
                    '`/hourly` - Claim your hourly reward of 1,000 coins.',
                    '`/quest difficulty:<easy|medium|hard>` - Start a trivia quest.',
                    '`/math` - Solve an advanced math problem for 100,000 coins.',
                    '`/give user:<@user> amount:<amount>` - Give coins to another user.',
                    '`/help` - Show this help menu.',
                    '',
                    '**Prefix Commands**',
                    '`cmmine <amount>` - Start a game with the specified bet.',
                    '`cmbalance` - Check your current coin balance.',
                    '`cmhourly` - Claim your hourly reward of 1,000 coins.',
                    '`cmquest <easy|medium|hard>` - Start a trivia quest.',
                    '`cmmath` - Solve an advanced math problem for 100,000 coins.',
                    '`cmgive <@user> <amount>` - Give coins to another user.',
                    '`cmhelp` - Show this help menu.',
                    '',
                    '**Admin Commands (Authorized Users Only)**',
                    '`/admin give user:<@user> amount:<amount>` - Give coins to a user.',
                    '`/admin set-balance user:<@user> amount:<amount>` - Set a exact balance.',
                    '`/admin reset user:<@user>` - Reset a user\'s balance to default.',
                    '`/admin check user:<@user>` - Check any user\'s balance.',
                ].join('\n')
            )
            .setFooter({ text: 'Have fun mining!' })
            .setTimestamp();
    }
}
