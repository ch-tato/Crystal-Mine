import { describe, it, expect } from 'vitest';
import { MineBoard } from '../src/game/MineBoard.js';
import { TileState } from '../src/types/GameState.js';

describe('MineBoard', () => {
    describe('constructor', () => {
        it('creates a board with the correct number of tiles', () => {
            const board = new MineBoard(3, 3);
            expect(board.getTotalTiles()).toBe(9);
            expect(board.getSize()).toBe(3);
        });

        it('creates a board with the correct number of bombs', () => {
            const board = new MineBoard(3, 3);
            const bombs = board.getBombPositions();
            expect(bombs.length).toBe(3);
        });

        it('throws if bomb count >= total tiles', () => {
            expect(() => new MineBoard(3, 9)).toThrow('Bomb count (9) must be less than total tiles (9)');
            expect(() => new MineBoard(3, 10)).toThrow();
        });

        it('throws if bomb count < 1', () => {
            expect(() => new MineBoard(3, 0)).toThrow('Bomb count must be at least 1');
        });

        it('places bombs at unique positions', () => {
            for (let i = 0; i < 50; i++) {
                const board = new MineBoard(3, 3);
                const positions = board.getBombPositions();
                const uniquePositions = new Set(positions);
                expect(uniquePositions.size).toBe(positions.length);
            }
        });

        it('places bombs within valid range', () => {
            for (let i = 0; i < 50; i++) {
                const board = new MineBoard(3, 3);
                const positions = board.getBombPositions();
                for (const pos of positions) {
                    expect(pos).toBeGreaterThanOrEqual(0);
                    expect(pos).toBeLessThan(9);
                }
            }
        });

        it('all tiles start hidden', () => {
            const board = new MineBoard(3, 3);
            const tiles = board.getTiles();
            for (const tile of tiles) {
                expect(tile.state).toBe(TileState.Hidden);
            }
        });
    });

    describe('revealTile', () => {
        it('reveals a safe tile correctly', () => {
            const board = new MineBoard(3, 3);
            const bombPositions = new Set(board.getBombPositions());

            // Find a safe position
            let safePos = -1;
            for (let i = 0; i < 9; i++) {
                if (!bombPositions.has(i)) {
                    safePos = i;
                    break;
                }
            }
            expect(safePos).toBeGreaterThanOrEqual(0);

            const result = board.revealTile(safePos);
            expect(result.isBomb).toBe(false);
            expect(result.tile.state).toBe(TileState.RevealedSafe);
            expect(result.tile.containsBomb).toBe(false);
        });

        it('reveals a bomb tile correctly', () => {
            const board = new MineBoard(3, 3);
            const bombPos = board.getBombPositions()[0];

            const result = board.revealTile(bombPos);
            expect(result.isBomb).toBe(true);
            expect(result.tile.state).toBe(TileState.RevealedBomb);
            expect(result.tile.containsBomb).toBe(true);
        });

        it('throws when revealing an already revealed tile', () => {
            const board = new MineBoard(3, 3);
            const bombPositions = new Set(board.getBombPositions());
            let safePos = -1;
            for (let i = 0; i < 9; i++) {
                if (!bombPositions.has(i)) {
                    safePos = i;
                    break;
                }
            }

            board.revealTile(safePos);
            expect(() => board.revealTile(safePos)).toThrow('already revealed');
        });

        it('throws for out-of-bounds position', () => {
            const board = new MineBoard(3, 3);
            expect(() => board.revealTile(-1)).toThrow('out of bounds');
            expect(() => board.revealTile(9)).toThrow('out of bounds');
        });
    });

    describe('revealAll', () => {
        it('reveals all tiles on the board', () => {
            const board = new MineBoard(3, 3);
            const tiles = board.revealAll();

            for (const tile of tiles) {
                expect(
                    tile.state === TileState.RevealedSafe || tile.state === TileState.RevealedBomb
                ).toBe(true);
            }
        });

        it('preserves already revealed tiles', () => {
            const board = new MineBoard(3, 3);
            const bombPositions = new Set(board.getBombPositions());
            let safePos = -1;
            for (let i = 0; i < 9; i++) {
                if (!bombPositions.has(i)) {
                    safePos = i;
                    break;
                }
            }

            board.revealTile(safePos);
            const tiles = board.revealAll();

            const safeTile = tiles.find((t) => t.position === safePos)!;
            expect(safeTile.state).toBe(TileState.RevealedSafe);
        });
    });

    describe('getRevealedSafeCount', () => {
        it('starts at 0', () => {
            const board = new MineBoard(3, 3);
            expect(board.getRevealedSafeCount()).toBe(0);
        });

        it('increments when safe tiles are revealed', () => {
            const board = new MineBoard(3, 3);
            const bombPositions = new Set(board.getBombPositions());

            let count = 0;
            for (let i = 0; i < 9; i++) {
                if (!bombPositions.has(i)) {
                    board.revealTile(i);
                    count++;
                    expect(board.getRevealedSafeCount()).toBe(count);
                    if (count >= 3) break;
                }
            }
        });

        it('does not increment when bomb tiles are revealed', () => {
            const board = new MineBoard(3, 3);
            const bombPos = board.getBombPositions()[0];
            board.revealTile(bombPos);
            expect(board.getRevealedSafeCount()).toBe(0);
        });
    });

    describe('board sizes', () => {
        it('supports 4x4 boards', () => {
            const board = new MineBoard(4, 5);
            expect(board.getTotalTiles()).toBe(16);
            expect(board.getBombPositions().length).toBe(5);
        });

        it('supports 5x5 boards', () => {
            const board = new MineBoard(5, 7);
            expect(board.getTotalTiles()).toBe(25);
            expect(board.getBombPositions().length).toBe(7);
        });
    });
});
