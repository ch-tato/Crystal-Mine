export class MultiplierCalculator {
    private readonly table: readonly number[];

    constructor(multiplierTable: readonly number[]) {
        if (multiplierTable.length === 0) {
            throw new Error('Multiplier table must have at least one entry');
        }
        this.table = multiplierTable;
    }

    /**
     * Returns the multiplier for the given number of revealed safe tiles.
     * If the count exceeds the table, returns the last value.
     */
    getMultiplier(revealedCount: number): number {
        if (revealedCount < 0) {
            throw new RangeError('Revealed count cannot be negative');
        }
        const index = Math.min(revealedCount, this.table.length - 1);
        return this.table[index];
    }

    /**
     * Calculates the payout: bet × multiplier for the given reveal count.
     */
    calculatePayout(bet: number, revealedCount: number): number {
        return Math.floor(bet * this.getMultiplier(revealedCount));
    }

    /**
     * Returns the full multiplier table for display purposes.
     */
    getTable(): readonly number[] {
        return this.table;
    }
}
