import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import { GameState, TileState } from '../types/GameState.js';

const TILE_LABELS = {
    hidden: '⬛',
    crystal: '💎',
    bomb: '💣',
    disabled: '⬜',
} as const;

export class MineButtonBuilder {
    /**
     * Builds the interactive button grid + cash out button for the game.
     * Discord allows max 5 buttons per ActionRow and max 5 rows per message.
     * For a 3×3 board: 3 rows of 3 tile buttons + 1 row for Cash Out = 4 rows total.
     */
    static buildGameButtons(state: GameState): ActionRowBuilder<ButtonBuilder>[] {
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        const { board, boardSize, gameId, status } = state;
        const isEnded = status !== 'active';

        for (let row = 0; row < boardSize; row++) {
            const actionRow = new ActionRowBuilder<ButtonBuilder>();
            const buttons: ButtonBuilder[] = [];

            for (let col = 0; col < boardSize; col++) {
                const position = row * boardSize + col;
                const tile = board[position];
                const button = MineButtonBuilder.buildTileButton(tile.state, position, gameId, isEnded);
                buttons.push(button);
            }

            actionRow.addComponents(...buttons);
            rows.push(actionRow);
        }

        const cashOutRow = new ActionRowBuilder<ButtonBuilder>();
        const cashOutButton = new ButtonBuilder()
            .setCustomId(`mine_cashout_${gameId}`)
            .setLabel('💰 Cash Out')
            .setStyle(ButtonStyle.Success);

        if (isEnded || state.revealedCount === 0) {
            cashOutButton.setDisabled(true);
        }

        cashOutRow.addComponents(cashOutButton);
        rows.push(cashOutRow);

        return rows;
    }

    /**
     * Builds buttons with all tiles disabled — used after game ends.
     */
    static buildEndedButtons(state: GameState): ActionRowBuilder<ButtonBuilder>[] {
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        const { board, boardSize, gameId } = state;

        for (let row = 0; row < boardSize; row++) {
            const actionRow = new ActionRowBuilder<ButtonBuilder>();
            const buttons: ButtonBuilder[] = [];

            for (let col = 0; col < boardSize; col++) {
                const position = row * boardSize + col;
                const tile = board[position];
                const button = MineButtonBuilder.buildTileButton(tile.state, position, gameId, true);
                buttons.push(button);
            }

            actionRow.addComponents(...buttons);
            rows.push(actionRow);
        }

        const cashOutRow = new ActionRowBuilder<ButtonBuilder>();
        cashOutRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`mine_cashout_${gameId}`)
                .setLabel('💰 Cash Out')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true)
        );
        rows.push(cashOutRow);

        return rows;
    }

    private static buildTileButton(
        tileState: TileState,
        position: number,
        gameId: string,
        disabled: boolean
    ): ButtonBuilder {
        const button = new ButtonBuilder()
            .setCustomId(`mine_tile_${position}_${gameId}`);

        switch (tileState) {
            case TileState.Hidden:
                button
                    .setLabel(TILE_LABELS.hidden)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled);
                break;

            case TileState.RevealedSafe:
                button
                    .setLabel(TILE_LABELS.crystal)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true);
                break;

            case TileState.RevealedBomb:
                button
                    .setLabel(TILE_LABELS.bomb)
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true);
                break;

            case TileState.Disabled:
                button
                    .setLabel(TILE_LABELS.disabled)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);
                break;
        }

        return button;
    }
}
