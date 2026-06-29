export enum TileState {
    Hidden = 'hidden',
    RevealedSafe = 'revealed_safe',
    RevealedBomb = 'revealed_bomb',
    Disabled = 'disabled',
}

export enum GameStatus {
    Active = 'active',
    Won = 'won',
    Lost = 'lost',
    Expired = 'expired',
}

export interface Tile {
    readonly position: number;
    readonly containsBomb: boolean;
    state: TileState;
}

export interface GameState {
    readonly gameId: string;
    readonly playerId: string;
    readonly bet: number;
    readonly boardSize: number;
    readonly bombCount: number;
    readonly board: readonly Tile[];
    readonly bombPositions: readonly number[];
    readonly revealedCount: number;
    readonly multiplier: number;
    readonly potentialPayout: number;
    status: GameStatus;
    readonly startTime: number;
    readonly timeoutMs: number;
    messageId: string | null;
    channelId: string | null;
}

export interface RevealResult {
    readonly isBomb: boolean;
    readonly tile: Tile;
    readonly gameOver: boolean;
    readonly multiplier: number;
    readonly payout: number;
    readonly status: GameStatus;
}

export interface CashOutResult {
    readonly payout: number;
    readonly multiplier: number;
    readonly revealedCount: number;
    readonly status: GameStatus;
}

export interface GameResult {
    readonly status: GameStatus;
    readonly payout: number;
    readonly multiplier: number;
    readonly revealedCount: number;
}
