import { describe, it, expect, beforeEach } from 'vitest';
import { MineGame } from '../src/game/MineGame.js';
import { GameStatus } from '../src/types/GameState.js';
import { GameConfig } from '../src/config/gameConfig.js';

const CFG: GameConfig = {
    boardSize: 3, bombs: 3, timeout: 120, minBet: 100,
    maxBet: 1_000_000, cooldownMs: 3_000,
    multiplierTable: [1.0, 1.2, 1.45, 1.78, 2.25, 3.0, 4.5],
    defaultBalance: 10_000,
};

function safePos(g: MineGame): number[] {
    const s = g.getState();
    const b = new Set(s.bombPositions);
    return Array.from({ length: 9 }, (_, i) => i).filter((i) => !b.has(i));
}

describe('MineGame', () => {
    it('initializes correctly', () => {
        const g = new MineGame('p1', 5000, CFG);
        const s = g.getState();
        expect(s.status).toBe(GameStatus.Active);
        expect(s.bet).toBe(5000);
        expect(s.revealedCount).toBe(0);
        expect(s.multiplier).toBe(1.0);
    });

    it('safe reveal continues game', () => {
        const g = new MineGame('p1', 5000, CFG);
        const r = g.revealTile(safePos(g)[0]);
        expect(r.isBomb).toBe(false);
        expect(r.gameOver).toBe(false);
        expect(r.multiplier).toBe(1.2);
    });

    it('bomb ends game', () => {
        const g = new MineGame('p1', 5000, CFG);
        const r = g.revealTile(g.getState().bombPositions[0]);
        expect(r.isBomb).toBe(true);
        expect(r.gameOver).toBe(true);
        expect(r.status).toBe(GameStatus.Lost);
        expect(r.payout).toBe(0);
    });

    it('cashOut returns correct payout', () => {
        const g = new MineGame('p1', 5000, CFG);
        const sp = safePos(g);
        g.revealTile(sp[0]);
        g.revealTile(sp[1]);
        const r = g.cashOut();
        expect(r.status).toBe(GameStatus.Won);
        expect(r.payout).toBe(7250);
    });

    it('cannot cashOut with 0 reveals', () => {
        const g = new MineGame('p1', 5000, CFG);
        expect(() => g.cashOut()).toThrow();
    });

    it('expire sets Expired', () => {
        const g = new MineGame('p1', 5000, CFG);
        const r = g.expire();
        expect(r.status).toBe(GameStatus.Expired);
        expect(r.payout).toBe(0);
    });

    it('cannot act after game ends', () => {
        const g = new MineGame('p1', 5000, CFG);
        g.revealTile(g.getState().bombPositions[0]);
        expect(() => g.revealTile(0)).toThrow();
    });

    it('full win flow', () => {
        const g = new MineGame('p1', 1000, CFG);
        for (const p of safePos(g)) g.revealTile(p);
        const r = g.cashOut();
        expect(r.payout).toBe(4500);
        expect(r.multiplier).toBe(4.5);
    });
});
