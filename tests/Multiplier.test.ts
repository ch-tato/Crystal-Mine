import { describe, it, expect } from 'vitest';
import { MultiplierCalculator } from '../src/game/Multiplier.js';

const DEFAULT_TABLE = [1.0, 1.2, 1.45, 1.78, 2.25, 3.0, 4.5];

describe('MultiplierCalculator', () => {
    describe('constructor', () => {
        it('creates with a valid table', () => {
            const calc = new MultiplierCalculator(DEFAULT_TABLE);
            expect(calc.getTable()).toEqual(DEFAULT_TABLE);
        });

        it('throws with an empty table', () => {
            expect(() => new MultiplierCalculator([])).toThrow('at least one entry');
        });
    });

    describe('getMultiplier', () => {
        const calc = new MultiplierCalculator(DEFAULT_TABLE);

        it('returns 1.00 for 0 reveals', () => {
            expect(calc.getMultiplier(0)).toBe(1.0);
        });

        it('returns 1.20 for 1 reveal', () => {
            expect(calc.getMultiplier(1)).toBe(1.2);
        });

        it('returns 1.45 for 2 reveals', () => {
            expect(calc.getMultiplier(2)).toBe(1.45);
        });

        it('returns 1.78 for 3 reveals', () => {
            expect(calc.getMultiplier(3)).toBe(1.78);
        });

        it('returns 2.25 for 4 reveals', () => {
            expect(calc.getMultiplier(4)).toBe(2.25);
        });

        it('returns 3.00 for 5 reveals', () => {
            expect(calc.getMultiplier(5)).toBe(3.0);
        });

        it('returns 4.50 for 6 reveals', () => {
            expect(calc.getMultiplier(6)).toBe(4.5);
        });

        it('clamps to last value for counts beyond table', () => {
            expect(calc.getMultiplier(7)).toBe(4.5);
            expect(calc.getMultiplier(100)).toBe(4.5);
        });

        it('throws for negative count', () => {
            expect(() => calc.getMultiplier(-1)).toThrow('cannot be negative');
        });
    });

    describe('calculatePayout', () => {
        const calc = new MultiplierCalculator(DEFAULT_TABLE);

        it('returns bet × 1.00 for 0 reveals', () => {
            expect(calc.calculatePayout(5000, 0)).toBe(5000);
        });

        it('returns bet × 1.20 for 1 reveal', () => {
            expect(calc.calculatePayout(5000, 1)).toBe(6000);
        });

        it('returns bet × 1.45 for 2 reveals', () => {
            expect(calc.calculatePayout(5000, 2)).toBe(7250);
        });

        it('returns bet × 1.78 for 3 reveals', () => {
            expect(calc.calculatePayout(5000, 3)).toBe(8900);
        });

        it('returns bet × 2.25 for 4 reveals', () => {
            expect(calc.calculatePayout(5000, 4)).toBe(11250);
        });

        it('returns bet × 3.00 for 5 reveals', () => {
            expect(calc.calculatePayout(5000, 5)).toBe(15000);
        });

        it('returns bet × 4.50 for 6 reveals', () => {
            expect(calc.calculatePayout(5000, 6)).toBe(22500);
        });

        it('floors the result for non-integer payouts', () => {
            expect(calc.calculatePayout(333, 1)).toBe(Math.floor(333 * 1.2));
            expect(calc.calculatePayout(777, 2)).toBe(Math.floor(777 * 1.45));
        });

        it('handles small bets correctly', () => {
            expect(calc.calculatePayout(100, 1)).toBe(120);
        });

        it('handles large bets correctly', () => {
            expect(calc.calculatePayout(1000000, 6)).toBe(4500000);
        });
    });
});
