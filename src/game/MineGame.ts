import * as crypto from 'node:crypto';
import { MineBoard } from './MineBoard.js';
import { MultiplierCalculator } from './Multiplier.js';
import {
    GameState,
    GameStatus,
    RevealResult,
    CashOutResult,
    GameResult,
} from '../types/GameState.js';
import { GameConfig } from '../config/gameConfig.js';

export class MineGame {
    private readonly gameId: string;
    private readonly playerId: string;
    private readonly bet: number;
    private readonly board: MineBoard;
    private readonly multiplier: MultiplierCalculator;
    private readonly startTime: number;
    private readonly timeoutMs: number;

    private status: GameStatus;
    private messageId: string | null = null;
    private channelId: string | null = null;

    constructor(playerId: string, bet: number, config: GameConfig) {
        this.gameId = crypto.randomUUID();
        this.playerId = playerId;
        this.bet = bet;
        this.board = new MineBoard(config.boardSize, config.bombs);
        this.multiplier = new MultiplierCalculator(config.multiplierTable);
        this.startTime = Date.now();
        this.timeoutMs = config.timeout * 1000;
        this.status = GameStatus.Active;
    }

    getGameId(): string {
        return this.gameId;
    }

    getPlayerId(): string {
        return this.playerId;
    }

    isActive(): boolean {
        return this.status === GameStatus.Active;
    }

    /**
     * Reveals a tile at the given position.
     * Returns the result including whether the game continues or ended.
     */
    revealTile(position: number): RevealResult {
        this.assertActive();

        const { isBomb, tile } = this.board.revealTile(position);

        if (isBomb) {
            this.status = GameStatus.Lost;
            this.board.revealAll();

            return {
                isBomb: true,
                tile,
                gameOver: true,
                multiplier: 0,
                payout: 0,
                status: GameStatus.Lost,
            };
        }

        const revealedCount = this.board.getRevealedSafeCount();
        const currentMultiplier = this.multiplier.getMultiplier(revealedCount);
        const payout = this.multiplier.calculatePayout(this.bet, revealedCount);

        return {
            isBomb: false,
            tile,
            gameOver: false,
            multiplier: currentMultiplier,
            payout,
            status: GameStatus.Active,
        };
    }

    /**
     * Cashes out the current game. Player receives bet × multiplier.
     */
    cashOut(): CashOutResult {
        this.assertActive();

        const revealedCount = this.board.getRevealedSafeCount();

        if (revealedCount === 0) {
            throw new Error('Cannot cash out without revealing any tiles');
        }

        this.status = GameStatus.Won;
        this.board.revealAll();

        const currentMultiplier = this.multiplier.getMultiplier(revealedCount);
        const payout = this.multiplier.calculatePayout(this.bet, revealedCount);

        return {
            payout,
            multiplier: currentMultiplier,
            revealedCount,
            status: GameStatus.Won,
        };
    }

    /**
     * Expires the game due to timeout. Player loses the bet.
     */
    expire(): GameResult {
        if (!this.isActive()) {
            return {
                status: this.status,
                payout: 0,
                multiplier: 0,
                revealedCount: this.board.getRevealedSafeCount(),
            };
        }

        this.status = GameStatus.Expired;
        this.board.revealAll();

        return {
            status: GameStatus.Expired,
            payout: 0,
            multiplier: 0,
            revealedCount: this.board.getRevealedSafeCount(),
        };
    }

    /**
     * Returns a snapshot of the current game state (read-only view).
     */
    getState(): GameState {
        const revealedCount = this.board.getRevealedSafeCount();
        const currentMultiplier = this.multiplier.getMultiplier(revealedCount);
        const potentialPayout = this.multiplier.calculatePayout(this.bet, revealedCount);

        return {
            gameId: this.gameId,
            playerId: this.playerId,
            bet: this.bet,
            boardSize: this.board.getSize(),
            bombCount: this.board.getBombPositions().length,
            board: this.board.getTiles(),
            bombPositions: this.board.getBombPositions(),
            revealedCount,
            multiplier: currentMultiplier,
            potentialPayout,
            status: this.status,
            startTime: this.startTime,
            timeoutMs: this.timeoutMs,
            messageId: this.messageId,
            channelId: this.channelId,
        };
    }

    setMessageId(messageId: string): void {
        this.messageId = messageId;
    }

    setChannelId(channelId: string): void {
        this.channelId = channelId;
    }

    getBet(): number {
        return this.bet;
    }

    private assertActive(): void {
        if (!this.isActive()) {
            throw new Error(`Game ${this.gameId} is not active (status: ${this.status})`);
        }
    }
}
