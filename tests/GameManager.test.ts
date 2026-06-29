import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager } from '../src/game/GameManager.js';
import { InMemoryEconomy } from '../src/database/Economy.js';
import { GameConfig } from '../src/config/gameConfig.js';

const CFG: GameConfig = {
    boardSize: 3, bombs: 3, timeout: 120, minBet: 100,
    maxBet: 1_000_000, cooldownMs: 3_000,
    multiplierTable: [1.0, 1.2, 1.45, 1.78, 2.25, 3.0, 4.5],
    defaultBalance: 10_000,
};

describe('GameManager', () => {
    let economy: InMemoryEconomy;
    let manager: GameManager;

    beforeEach(() => {
        economy = new InMemoryEconomy(10_000);
        manager = new GameManager(economy, CFG);
    });

    it('starts a game and deducts balance', async () => {
        const result = await manager.startGame('p1', 500);
        expect(result.success).toBe(true);
        const bal = await economy.getBalance('p1');
        expect(bal).toBe(9500);
    });

    it('rejects if already in game', async () => {
        await manager.startGame('p1', 500);
        const r = await manager.startGame('p1', 500);
        expect(r.success).toBe(false);
        if (!r.success) expect(r.reason).toContain('already');
    });

    it('rejects insufficient balance', async () => {
        economy.setBalance('p1', 50);
        const r = await manager.startGame('p1', 500);
        expect(r.success).toBe(false);
        if (!r.success) expect(r.reason).toContain('Insufficient');
    });

    it('rejects bet below minimum', async () => {
        const r = await manager.startGame('p1', 10);
        expect(r.success).toBe(false);
        if (!r.success) expect(r.reason).toContain('Minimum');
    });

    it('rejects bet above maximum', async () => {
        economy.setBalance('p1', 2_000_000);
        const r = await manager.startGame('p1', 1_500_000);
        expect(r.success).toBe(false);
        if (!r.success) expect(r.reason).toContain('Maximum');
    });

    it('cashOut adds coins back', async () => {
        const r = await manager.startGame('p1', 1000);
        if (!r.success) throw new Error('should start');

        const game = r.game;
        const state = game.getState();
        const bombs = new Set(state.bombPositions);
        const safe = Array.from({ length: 9 }, (_, i) => i).filter((i) => !bombs.has(i));

        manager.revealTile('p1', safe[0]);
        await manager.cashOut('p1');

        const bal = await economy.getBalance('p1');
        expect(bal).toBe(9000 + 1200); // 10000 - 1000 + 1000*1.2
    });

    it('enforces cooldown after game ends', async () => {
        const r = await manager.startGame('p1', 500);
        if (!r.success) throw new Error('should start');

        const game = r.game;
        const bombPos = game.getState().bombPositions[0];
        manager.revealTile('p1', bombPos);

        const r2 = await manager.startGame('p1', 500);
        expect(r2.success).toBe(false);
        if (!r2.success) expect(r2.reason).toContain('wait');
    });

    it('tracks active game count', async () => {
        expect(manager.getActiveGameCount()).toBe(0);
        await manager.startGame('p1', 500);
        expect(manager.getActiveGameCount()).toBe(1);
        await manager.startGame('p2', 500);
        expect(manager.getActiveGameCount()).toBe(2);
    });
});
