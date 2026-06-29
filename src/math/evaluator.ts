/**
 * Recursive evaluator for MathNode ASTs.
 *
 * Every operation validates that its result is a finite integer.
 * If any intermediate step produces a non-integer, NaN, or Infinity,
 * an EvaluationError is thrown — allowing the generator to discard
 * the problem and retry.
 */

import type { MathNode } from './ast.js';

// ── Error Type ───────────────────────────────────────────────────────

export class EvaluationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EvaluationError';
    }
}

// ── Pure Math Helpers ────────────────────────────────────────────────

/** Asserts that a value is a safe, finite integer. */
function assertInteger(value: number, context: string): number {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
        throw new EvaluationError(`Non-integer result in ${context}: ${value}`);
    }
    if (!Number.isSafeInteger(value)) {
        throw new EvaluationError(`Integer overflow in ${context}: ${value}`);
    }
    return value;
}

/** Factorial: n! for n >= 0. */
export function factorial(n: number): number {
    if (n < 0) throw new EvaluationError(`Factorial of negative number: ${n}`);
    if (n > 20) throw new EvaluationError(`Factorial overflow: ${n}!`);
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

/** Greatest Common Divisor via Euclid's algorithm. */
export function gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        [a, b] = [b, a % b];
    }
    return a;
}

/** Least Common Multiple. */
export function lcm(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return assertInteger(Math.abs(a * b) / gcd(a, b), 'lcm');
}

/** Permutations: P(n, r) = n! / (n-r)! */
export function permutations(n: number, r: number): number {
    if (r < 0 || r > n || n < 0) {
        throw new EvaluationError(`Invalid permutation: P(${n}, ${r})`);
    }
    let result = 1;
    for (let i = n; i > n - r; i--) {
        result *= i;
    }
    return assertInteger(result, `P(${n},${r})`);
}

/** Combinations: C(n, r) = n! / (r! * (n-r)!) */
export function combinations(n: number, r: number): number {
    if (r < 0 || r > n || n < 0) {
        throw new EvaluationError(`Invalid combination: C(${n}, ${r})`);
    }
    if (r > n - r) r = n - r;
    let result = 1;
    for (let i = 0; i < r; i++) {
        result = result * (n - i) / (i + 1);
    }
    return assertInteger(result, `C(${n},${r})`);
}

/** Euler's Totient function φ(n). */
export function eulerTotient(n: number): number {
    if (n < 1) throw new EvaluationError(`Totient of non-positive: ${n}`);
    let result = n;
    let temp = n;
    for (let p = 2; p * p <= temp; p++) {
        if (temp % p === 0) {
            while (temp % p === 0) {
                temp /= p;
            }
            result -= result / p;
        }
    }
    if (temp > 1) {
        result -= result / temp;
    }
    return assertInteger(result, `φ(${n})`);
}

/** Sum of digits of |n|. */
export function digitSum(n: number): number {
    let sum = 0;
    n = Math.abs(n);
    while (n > 0) {
        sum += n % 10;
        n = Math.floor(n / 10);
    }
    return sum;
}

/** Count of primes ≤ n (the prime-counting function π(n)). */
export function primeCount(n: number): number {
    if (n < 2) return 0;
    const sieve = new Array(n + 1).fill(true);
    sieve[0] = sieve[1] = false;
    for (let i = 2; i * i <= n; i++) {
        if (sieve[i]) {
            for (let j = i * i; j <= n; j += i) {
                sieve[j] = false;
            }
        }
    }
    return sieve.filter(Boolean).length;
}

/** Fibonacci number F(n) for n >= 0. */
export function fibonacci(n: number): number {
    if (n < 0) throw new EvaluationError(`Fibonacci of negative: ${n}`);
    if (n > 46) throw new EvaluationError(`Fibonacci overflow: F(${n})`);
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
}

/** Integer logarithm: returns log_base(arg) only if it is an exact integer. */
export function integerLog(base: number, arg: number): number {
    if (base <= 0 || base === 1 || arg <= 0) {
        throw new EvaluationError(`Invalid log: log_${base}(${arg})`);
    }
    // Compute by repeated multiplication to avoid floating-point issues.
    let power = 1;
    let exponent = 0;
    while (power < arg) {
        power *= base;
        exponent++;
        if (exponent > 100) {
            throw new EvaluationError(`Log iteration limit: log_${base}(${arg})`);
        }
    }
    if (power === arg) {
        return exponent;
    }
    throw new EvaluationError(`Non-integer log: log_${base}(${arg})`);
}

/** Integer square root: returns √n only if n is a perfect square. */
export function integerSqrt(n: number): number {
    if (n < 0) throw new EvaluationError(`Square root of negative: ${n}`);
    const root = Math.round(Math.sqrt(n));
    if (root * root === n) {
        return root;
    }
    throw new EvaluationError(`Non-perfect square: √${n}`);
}

/** Integer cube root: returns ∛n only if n is a perfect cube. */
export function integerCbrt(n: number): number {
    const root = Math.round(Math.cbrt(n));
    if (root * root * root === n) {
        return root;
    }
    throw new EvaluationError(`Non-perfect cube: ∛${n}`);
}

// ── AST Evaluator ────────────────────────────────────────────────────

/** Recursively evaluates a MathNode AST and returns an integer result. */
export function evaluate(node: MathNode): number {
    switch (node.type) {
        case 'literal':
            return assertInteger(node.value, 'literal');

        case 'factorial':
            return factorial(evaluate(node.operand));

        case 'abs':
            return Math.abs(evaluate(node.operand));

        case 'sqrt':
            return integerSqrt(evaluate(node.operand));

        case 'cbrt':
            return integerCbrt(evaluate(node.operand));

        case 'totient':
            return eulerTotient(evaluate(node.operand));

        case 'digitSum':
            return digitSum(evaluate(node.operand));

        case 'primeCounting':
            return primeCount(evaluate(node.operand));

        case 'fibonacci':
            return fibonacci(evaluate(node.operand));

        case 'pow': {
            const base = evaluate(node.base);
            const exp = evaluate(node.exponent);
            if (exp < 0) throw new EvaluationError(`Negative exponent: ${base}^${exp}`);
            return assertInteger(Math.pow(base, exp), `${base}^${exp}`);
        }

        case 'mod': {
            const left = evaluate(node.left);
            const right = evaluate(node.right);
            if (right === 0) throw new EvaluationError('Modulo by zero');
            return ((left % right) + right) % right; // Always non-negative
        }

        case 'gcd':
            return gcd(evaluate(node.a), evaluate(node.b));

        case 'lcm':
            return lcm(evaluate(node.a), evaluate(node.b));

        case 'perm':
            return permutations(evaluate(node.n), evaluate(node.r));

        case 'comb':
            return combinations(evaluate(node.n), evaluate(node.r));

        case 'log':
            return integerLog(evaluate(node.base), evaluate(node.argument));

        case 'add':
            return assertInteger(evaluate(node.left) + evaluate(node.right), 'add');

        case 'sub':
            return assertInteger(evaluate(node.left) - evaluate(node.right), 'sub');

        case 'mul':
            return assertInteger(evaluate(node.left) * evaluate(node.right), 'mul');

        default: {
            const _exhaustive: never = node;
            throw new EvaluationError(`Unknown node type: ${(_exhaustive as any).type}`);
        }
    }
}
