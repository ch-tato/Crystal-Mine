import * as crypto from 'node:crypto';
import { Tile, TileState } from '../types/GameState.js';

export class MineBoard {
    private readonly tiles: Tile[];
    private readonly size: number;
    private readonly totalTiles: number;
    private readonly bombPositions: ReadonlySet<number>;

    constructor(size: number, bombCount: number) {
        this.size = size;
        this.totalTiles = size * size;

        if (bombCount >= this.totalTiles) {
            throw new Error(
                `Bomb count (${bombCount}) must be less than total tiles (${this.totalTiles})`
            );
        }
        if (bombCount < 1) {
            throw new Error('Bomb count must be at least 1');
        }

        const bombs = MineBoard.generateBombPositions(this.totalTiles, bombCount);
        this.bombPositions = new Set(bombs);

        this.tiles = Array.from({ length: this.totalTiles }, (_, index) => ({
            position: index,
            containsBomb: this.bombPositions.has(index),
            state: TileState.Hidden,
        }));
    }

    /**
     * Cryptographically secure bomb placement using Fisher-Yates shuffle.
     */
    private static generateBombPositions(totalTiles: number, bombCount: number): number[] {
        const positions = Array.from({ length: totalTiles }, (_, i) => i);

        for (let i = positions.length - 1; i > 0; i--) {
            const randomBytes = crypto.randomBytes(4);
            const randomIndex = randomBytes.readUInt32BE(0) % (i + 1);
            [positions[i], positions[randomIndex]] = [positions[randomIndex], positions[i]];
        }

        return positions.slice(0, bombCount);
    }

    getSize(): number {
        return this.size;
    }

    getTotalTiles(): number {
        return this.totalTiles;
    }

    getBombPositions(): readonly number[] {
        return Array.from(this.bombPositions);
    }

    getTile(position: number): Tile {
        this.validatePosition(position);
        return { ...this.tiles[position] };
    }

    getTiles(): readonly Tile[] {
        return this.tiles.map((t) => ({ ...t }));
    }

    /**
     * Reveals a single tile. Returns a copy of the tile with updated state.
     * Throws if the tile is already revealed.
     */
    revealTile(position: number): { isBomb: boolean; tile: Tile } {
        this.validatePosition(position);

        const tile = this.tiles[position];
        if (tile.state !== TileState.Hidden) {
            throw new Error(`Tile at position ${position} is already revealed`);
        }

        tile.state = tile.containsBomb ? TileState.RevealedBomb : TileState.RevealedSafe;

        return {
            isBomb: tile.containsBomb,
            tile: { ...tile },
        };
    }

    /**
     * Reveals all hidden tiles — used on game end.
     */
    revealAll(): readonly Tile[] {
        for (const tile of this.tiles) {
            if (tile.state === TileState.Hidden) {
                tile.state = tile.containsBomb ? TileState.RevealedBomb : TileState.RevealedSafe;
            }
        }
        return this.getTiles();
    }

    /**
     * Disables all tiles — used for button disabling after game end.
     */
    disableAll(): readonly Tile[] {
        for (const tile of this.tiles) {
            if (tile.state === TileState.Hidden) {
                tile.state = TileState.Disabled;
            }
        }
        return this.getTiles();
    }

    getRevealedSafeCount(): number {
        return this.tiles.filter((t) => t.state === TileState.RevealedSafe).length;
    }

    private validatePosition(position: number): void {
        if (position < 0 || position >= this.totalTiles) {
            throw new RangeError(
                `Position ${position} is out of bounds (0-${this.totalTiles - 1})`
            );
        }
    }
}
