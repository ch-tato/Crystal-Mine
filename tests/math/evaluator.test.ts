/**
 * Tests for the math evaluator and all pure math helper functions.
 */

import { describe, it, expect } from 'vitest';
import {
    factorial,
    gcd,
    lcm,
    permutations,
    combinations,
    eulerTotient,
    digitSum,
    primeCount,
    fibonacci,
    integerLog,
    integerSqrt,
    integerCbrt,
    evaluate,
    EvaluationError,
} from '../../src/math/evaluator.js';
import type { MathNode } from '../../src/math/ast.js';
import { literal, add, sub, mul } from '../../src/math/ast.js';

// ── Factorial ────────────────────────────────────────────────────────

describe('factorial', () => {
    it('computes 0! = 1', () => expect(factorial(0)).toBe(1));
    it('computes 1! = 1', () => expect(factorial(1)).toBe(1));
    it('computes 5! = 120', () => expect(factorial(5)).toBe(120));
    it('computes 7! = 5040', () => expect(factorial(7)).toBe(5040));
    it('computes 10! = 3628800', () => expect(factorial(10)).toBe(3628800));
    it('throws for negative input', () => expect(() => factorial(-1)).toThrow(EvaluationError));
    it('throws for overflow (n > 20)', () => expect(() => factorial(21)).toThrow(EvaluationError));
});

// ── GCD ──────────────────────────────────────────────────────────────

describe('gcd', () => {
    it('gcd(12, 8) = 4', () => expect(gcd(12, 8)).toBe(4));
    it('gcd(48, 18) = 6', () => expect(gcd(48, 18)).toBe(6));
    it('gcd(7, 13) = 1 (coprime)', () => expect(gcd(7, 13)).toBe(1));
    it('gcd(0, 5) = 5', () => expect(gcd(0, 5)).toBe(5));
    it('handles negative values', () => expect(gcd(-12, 8)).toBe(4));
});

// ── LCM ──────────────────────────────────────────────────────────────

describe('lcm', () => {
    it('lcm(4, 6) = 12', () => expect(lcm(4, 6)).toBe(12));
    it('lcm(3, 5) = 15', () => expect(lcm(3, 5)).toBe(15));
    it('lcm(0, 5) = 0', () => expect(lcm(0, 5)).toBe(0));
    it('lcm(7, 7) = 7', () => expect(lcm(7, 7)).toBe(7));
});

// ── Permutations ─────────────────────────────────────────────────────

describe('permutations', () => {
    it('P(5, 2) = 20', () => expect(permutations(5, 2)).toBe(20));
    it('P(7, 3) = 210', () => expect(permutations(7, 3)).toBe(210));
    it('P(4, 0) = 1', () => expect(permutations(4, 0)).toBe(1));
    it('P(4, 4) = 24', () => expect(permutations(4, 4)).toBe(24));
    it('throws for r > n', () => expect(() => permutations(3, 5)).toThrow(EvaluationError));
});

// ── Combinations ─────────────────────────────────────────────────────

describe('combinations', () => {
    it('C(5, 2) = 10', () => expect(combinations(5, 2)).toBe(10));
    it('C(10, 3) = 120', () => expect(combinations(10, 3)).toBe(120));
    it('C(7, 0) = 1', () => expect(combinations(7, 0)).toBe(1));
    it('C(7, 7) = 1', () => expect(combinations(7, 7)).toBe(1));
    it('C(10, 4) = 210', () => expect(combinations(10, 4)).toBe(210));
    it('throws for r > n', () => expect(() => combinations(3, 5)).toThrow(EvaluationError));
});

// ── Euler Totient ────────────────────────────────────────────────────

describe('eulerTotient', () => {
    it('φ(1) = 1', () => expect(eulerTotient(1)).toBe(1));
    it('φ(6) = 2', () => expect(eulerTotient(6)).toBe(2));
    it('φ(7) = 6 (prime)', () => expect(eulerTotient(7)).toBe(6));
    it('φ(10) = 4', () => expect(eulerTotient(10)).toBe(4));
    it('φ(12) = 4', () => expect(eulerTotient(12)).toBe(4));
    it('φ(30) = 8', () => expect(eulerTotient(30)).toBe(8));
    it('throws for non-positive input', () => expect(() => eulerTotient(0)).toThrow(EvaluationError));
});

// ── Digit Sum ────────────────────────────────────────────────────────

describe('digitSum', () => {
    it('S(123) = 6', () => expect(digitSum(123)).toBe(6));
    it('S(9999) = 36', () => expect(digitSum(9999)).toBe(36));
    it('S(0) = 0', () => expect(digitSum(0)).toBe(0));
    it('S(100) = 1', () => expect(digitSum(100)).toBe(1));
    it('handles negative values', () => expect(digitSum(-456)).toBe(15));
});

// ── Prime Counting ───────────────────────────────────────────────────

describe('primeCount', () => {
    it('π(1) = 0', () => expect(primeCount(1)).toBe(0));
    it('π(2) = 1', () => expect(primeCount(2)).toBe(1));
    it('π(10) = 4', () => expect(primeCount(10)).toBe(4));
    it('π(20) = 8', () => expect(primeCount(20)).toBe(8));
    it('π(50) = 15', () => expect(primeCount(50)).toBe(15));
});

// ── Fibonacci ────────────────────────────────────────────────────────

describe('fibonacci', () => {
    it('F(0) = 0', () => expect(fibonacci(0)).toBe(0));
    it('F(1) = 1', () => expect(fibonacci(1)).toBe(1));
    it('F(5) = 5', () => expect(fibonacci(5)).toBe(5));
    it('F(10) = 55', () => expect(fibonacci(10)).toBe(55));
    it('F(12) = 144', () => expect(fibonacci(12)).toBe(144));
    it('throws for negative', () => expect(() => fibonacci(-1)).toThrow(EvaluationError));
});

// ── Integer Log ──────────────────────────────────────────────────────

describe('integerLog', () => {
    it('log_2(8) = 3', () => expect(integerLog(2, 8)).toBe(3));
    it('log_2(32) = 5', () => expect(integerLog(2, 32)).toBe(5));
    it('log_3(27) = 3', () => expect(integerLog(3, 27)).toBe(3));
    it('log_5(125) = 3', () => expect(integerLog(5, 125)).toBe(3));
    it('log_10(1000) = 3', () => expect(integerLog(10, 1000)).toBe(3));
    it('throws for non-integer log', () => expect(() => integerLog(2, 5)).toThrow(EvaluationError));
    it('throws for base 1', () => expect(() => integerLog(1, 5)).toThrow(EvaluationError));
});

// ── Integer Square Root ──────────────────────────────────────────────

describe('integerSqrt', () => {
    it('√4 = 2', () => expect(integerSqrt(4)).toBe(2));
    it('√144 = 12', () => expect(integerSqrt(144)).toBe(12));
    it('√0 = 0', () => expect(integerSqrt(0)).toBe(0));
    it('√1 = 1', () => expect(integerSqrt(1)).toBe(1));
    it('throws for non-perfect square', () => expect(() => integerSqrt(5)).toThrow(EvaluationError));
    it('throws for negative', () => expect(() => integerSqrt(-4)).toThrow(EvaluationError));
});

// ── Integer Cube Root ────────────────────────────────────────────────

describe('integerCbrt', () => {
    it('∛8 = 2', () => expect(integerCbrt(8)).toBe(2));
    it('∛27 = 3', () => expect(integerCbrt(27)).toBe(3));
    it('∛-27 = -3', () => expect(integerCbrt(-27)).toBe(-3));
    it('∛0 = 0', () => expect(integerCbrt(0)).toBe(0));
    it('throws for non-perfect cube', () => expect(() => integerCbrt(5)).toThrow(EvaluationError));
});

// ── AST Evaluator ────────────────────────────────────────────────────

describe('evaluate', () => {
    it('evaluates a literal', () => {
        expect(evaluate(literal(42))).toBe(42);
    });

    it('evaluates addition', () => {
        expect(evaluate(add(literal(10), literal(20)))).toBe(30);
    });

    it('evaluates subtraction', () => {
        expect(evaluate(sub(literal(50), literal(20)))).toBe(30);
    });

    it('evaluates multiplication', () => {
        expect(evaluate(mul(literal(6), literal(7)))).toBe(42);
    });

    it('evaluates nested expression: (3! + √25) × 2', () => {
        const ast: MathNode = {
            type: 'mul',
            left: {
                type: 'add',
                left: { type: 'factorial', operand: literal(3) },
                right: { type: 'sqrt', operand: literal(25) },
            },
            right: literal(2),
        };
        // (6 + 5) × 2 = 22
        expect(evaluate(ast)).toBe(22);
    });

    it('evaluates complex expression: C(5,2) + P(4,2) - gcd(12,8)', () => {
        const ast: MathNode = sub(
            add(
                { type: 'comb', n: literal(5), r: literal(2) },
                { type: 'perm', n: literal(4), r: literal(2) },
            ),
            { type: 'gcd', a: literal(12), b: literal(8) },
        );
        // C(5,2)=10, P(4,2)=12, gcd(12,8)=4 → 10+12-4 = 18
        expect(evaluate(ast)).toBe(18);
    });

    it('evaluates modular arithmetic', () => {
        const ast: MathNode = { type: 'mod', left: literal(17), right: literal(5) };
        expect(evaluate(ast)).toBe(2);
    });

    it('evaluates absolute value', () => {
        const ast: MathNode = { type: 'abs', operand: sub(literal(3), literal(10)) };
        expect(evaluate(ast)).toBe(7);
    });

    it('evaluates power', () => {
        const ast: MathNode = { type: 'pow', base: literal(3), exponent: literal(4) };
        expect(evaluate(ast)).toBe(81);
    });

    it('evaluates integer log', () => {
        const ast: MathNode = { type: 'log', base: literal(2), argument: literal(16) };
        expect(evaluate(ast)).toBe(4);
    });

    it('evaluates Euler totient', () => {
        const ast: MathNode = { type: 'totient', operand: literal(12) };
        expect(evaluate(ast)).toBe(4);
    });

    it('evaluates digit sum', () => {
        const ast: MathNode = { type: 'digitSum', operand: literal(1234) };
        expect(evaluate(ast)).toBe(10);
    });

    it('evaluates prime counting', () => {
        const ast: MathNode = { type: 'primeCounting', operand: literal(20) };
        expect(evaluate(ast)).toBe(8);
    });

    it('evaluates Fibonacci', () => {
        const ast: MathNode = { type: 'fibonacci', operand: literal(10) };
        expect(evaluate(ast)).toBe(55);
    });

    it('evaluates cube root', () => {
        const ast: MathNode = { type: 'cbrt', operand: literal(125) };
        expect(evaluate(ast)).toBe(5);
    });

    it('evaluates LCM', () => {
        const ast: MathNode = { type: 'lcm', a: literal(4), b: literal(6) };
        expect(evaluate(ast)).toBe(12);
    });
});
