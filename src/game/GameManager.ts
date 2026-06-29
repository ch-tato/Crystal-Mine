import { MineGame } from './MineGame.js';
import { IEconomyProvider } from '../types/Economy.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameState, RevealResult, CashOutResult, GameResult } from '../types/GameState.js';
import { logger } from '../utils/logger.js';

export interface StartGameResult {
    readonly success: true;
    readonly game: MineGame;
    readonly state: GameState;
}

export interface StartGameError {
    readonly success: false;
    readonly reason: string;
}

export class GameManager {
    private readonly activeGames = new Map<string, MineGame>();
    private readonly cooldowns = new Map<string, number>();
    private readonly timeouts = new Map<string, ReturnType<typeof setTimeout>>();
    private readonly economy: IEconomyProvider;
    private readonly config: GameConfig;
    private onGameExpired?: (playerId: string, state: GameState) => void;

    constructor(economy: IEconomyProvider, config: GameConfig) {
        this.economy = economy;
        this.config = config;
    }

    /**
     * Registers a callback invoked when a game expires due to timeout.
     * Used by the Discord layer to update the message.
     */
    setOnGameExpired(handler: (playerId: string, state: GameState) => void): void {
        this.onGameExpired = handler;
    }

    async startGame(playerId: string, bet: number): Promise<StartGameResult | StartGameError> {
        if (this.hasActiveGame(playerId)) {
            return { success: false, reason: 'You already have an active game.' };
        }

        if (this.isOnCooldown(playerId)) {
            const remaining = this.getCooldownRemaining(playerId);
            return {
                success: false,
                reason: `Please wait ${(remaining / 1000).toFixed(1)}s before starting a new game.`,
            };
        }

        if (bet < this.config.minBet) {
            return {
                success: false,
                reason: `Minimum bet is **${this.config.minBet.toLocaleString()}** coins.`,
            };
        }

        if (bet > this.config.maxBet) {
            return {
                success: false,
                reason: `Maximum bet is **${this.config.maxBet.toLocaleString()}** coins.`,
            };
        }

        const balance = await this.economy.getBalance(playerId);
        if (balance < bet) {
            return {
                success: false,
                reason: `Insufficient balance. You have **${balance.toLocaleString()}** coins but tried to bet **${bet.toLocaleString()}**.`,
            };
        }

        const game = new MineGame(playerId, bet, this.config);

        await this.economy.removeCoins(playerId, bet, 'Crystal Mine bet', game.getGameId());
        await this.economy.transactionLog({
            userId: playerId,
            amount: bet,
            type: 'bet',
            reason: 'Crystal Mine bet',
            timestamp: Date.now(),
            gameId: game.getGameId(),
        });

        this.activeGames.set(playerId, game);
        this.scheduleTimeout(playerId, game);

        logger.info('GameManager', `Game started for ${playerId}`, {
            gameId: game.getGameId(),
            bet,
        });

        return {
            success: true,
            game,
            state: game.getState(),
        };
    }

    revealTile(playerId: string, position: number): RevealResult {
        const game = this.getActiveGame(playerId);
        const result = game.revealTile(position);

        if (result.gameOver) {
            this.endGame(playerId);
            logger.info('GameManager', `Game lost for ${playerId}`, {
                gameId: game.getGameId(),
            });
        }

        return result;
    }

    async cashOut(playerId: string): Promise<CashOutResult> {
        const game = this.getActiveGame(playerId);
        const result = game.cashOut();

        await this.economy.addCoins(playerId, result.payout, 'Crystal Mine win', game.getGameId());
        await this.economy.transactionLog({
            userId: playerId,
            amount: result.payout,
            type: 'win',
            reason: 'Crystal Mine cash out',
            timestamp: Date.now(),
            gameId: game.getGameId(),
        });

        this.endGame(playerId);

        logger.info('GameManager', `Game won for ${playerId}`, {
            gameId: game.getGameId(),
            payout: result.payout,
            multiplier: result.multiplier,
        });

        return result;
    }

    getGame(playerId: string): MineGame | undefined {
        return this.activeGames.get(playerId);
    }

    getGameState(playerId: string): GameState | undefined {
        return this.activeGames.get(playerId)?.getState();
    }

    hasActiveGame(playerId: string): boolean {
        return this.activeGames.has(playerId);
    }

    isOnCooldown(playerId: string): boolean {
        const cooldownEnd = this.cooldowns.get(playerId);
        if (!cooldownEnd) return false;
        if (Date.now() >= cooldownEnd) {
            this.cooldowns.delete(playerId);
            return false;
        }
        return true;
    }

    getActiveGameCount(): number {
        return this.activeGames.size;
    }

    private getActiveGame(playerId: string): MineGame {
        const game = this.activeGames.get(playerId);
        if (!game) {
            throw new Error(`No active game found for player ${playerId}`);
        }
        if (!game.isActive()) {
            throw new Error(`Game for player ${playerId} is no longer active`);
        }
        return game;
    }

    private endGame(playerId: string): void {
        const timeout = this.timeouts.get(playerId);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(playerId);
        }

        this.activeGames.delete(playerId);
        this.cooldowns.set(playerId, Date.now() + this.config.cooldownMs);
    }

    private getCooldownRemaining(playerId: string): number {
        const cooldownEnd = this.cooldowns.get(playerId);
        if (!cooldownEnd) return 0;
        return Math.max(0, cooldownEnd - Date.now());
    }

    private scheduleTimeout(playerId: string, game: MineGame): void {
        const timer = setTimeout(async () => {
            if (!game.isActive()) return;

            const result = game.expire();
            const state = game.getState();
            this.endGame(playerId);

            logger.info('GameManager', `Game expired for ${playerId}`, {
                gameId: game.getGameId(),
                revealedCount: result.revealedCount,
            });

            this.onGameExpired?.(playerId, state);
        }, this.config.timeout * 1000);

        // Prevent the timer from keeping the Node.js process alive
        timer.unref();
        this.timeouts.set(playerId, timer);
    }
}
