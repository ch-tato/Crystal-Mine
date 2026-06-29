export interface GameConfig {
    readonly boardSize: number;
    readonly bombs: number;
    readonly timeout: number;
    readonly minBet: number;
    readonly maxBet: number;
    readonly cooldownMs: number;
    readonly multiplierTable: readonly number[];
    readonly defaultBalance: number;
}

const DEFAULT_CONFIG: GameConfig = Object.freeze({
    boardSize: 3,
    bombs: 3,
    timeout: 120,
    minBet: 100,
    maxBet: 1_000_000,
    cooldownMs: 3_000,
    multiplierTable: Object.freeze([1.0, 1.2, 1.45, 1.78, 2.25, 3.0, 4.5]),
    defaultBalance: 10_000,
});

function loadConfigOverrides(): Partial<GameConfig> {
    try {
        /* eslint-disable @typescript-eslint/no-require-imports */
        const fs = require('fs');
        const path = require('path');
        const configPath = path.resolve(process.cwd(), 'config.json');
        if (fs.existsSync(configPath)) {
            const raw = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(raw) as Partial<GameConfig>;
        }
    } catch {
        // config.json is optional — fall back to defaults silently
    }
    return {};
}

const overrides = loadConfigOverrides();

export const gameConfig: GameConfig = Object.freeze({
    ...DEFAULT_CONFIG,
    ...overrides,
    multiplierTable: Object.freeze(
        overrides.multiplierTable ?? DEFAULT_CONFIG.multiplierTable
    ),
});
