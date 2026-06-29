/**
 * Math problem generator using template-based reverse engineering.
 *
 * Strategy:
 * 1. Each "concept template" is a function that picks controlled random
 *    parameters and returns a MathNode subtree guaranteed to evaluate
 *    to an integer.
 * 2. On each generate() call, 4–7 templates are randomly selected and
 *    composed via add/sub operations into a single AST.
 * 3. The complete tree is evaluated. If the result is non-integer,
 *    |result| > 5000, or evaluation throws, the attempt is discarded
 *    and the generator retries (up to 50 times).
 */

import { type MathNode, literal, add, sub } from './ast.js';
import { evaluate, EvaluationError } from './evaluator.js';
import { toLatex } from './latex.js';

// ── Random Helpers ───────────────────────────────────────────────────

/** Returns a random integer in [min, max] inclusive. */
function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Picks a random element from an array. */
function pickRandom<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/** Shuffles an array in-place (Fisher-Yates). */
function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ── Concept Templates ────────────────────────────────────────────────

type TemplateFunction = () => MathNode;

/** Factorial: n! for n ∈ [3, 7]. Always integer. */
function factorialTemplate(): MathNode {
    const n = randInt(3, 7);
    return { type: 'factorial', operand: literal(n) };
}

/** Exponentiation: base^exp for small values. Always integer. */
function powTemplate(): MathNode {
    const base = randInt(2, 5);
    const exp = randInt(2, 4);
    return { type: 'pow', base: literal(base), exponent: literal(exp) };
}

/** Permutation: P(n, r). Always integer. */
function permTemplate(): MathNode {
    const n = randInt(4, 8);
    const r = randInt(1, 3);
    return { type: 'perm', n: literal(n), r: literal(r) };
}

/** Combination: C(n, r). Always integer. */
function combTemplate(): MathNode {
    const n = randInt(4, 10);
    const r = randInt(1, Math.min(4, n));
    return { type: 'comb', n: literal(n), r: literal(r) };
}

/** GCD of two composite numbers. Always integer. */
function gcdTemplate(): MathNode {
    const a = randInt(12, 120);
    const b = randInt(12, 120);
    return { type: 'gcd', a: literal(a), b: literal(b) };
}

/** LCM of two small values. Always integer (bounded by template limits). */
function lcmTemplate(): MathNode {
    const a = randInt(3, 15);
    const b = randInt(3, 15);
    return { type: 'lcm', a: literal(a), b: literal(b) };
}

/** Modular arithmetic: a mod b. Always integer. */
function modTemplate(): MathNode {
    const a = randInt(10, 99);
    const b = randInt(3, 13);
    return { type: 'mod', left: literal(a), right: literal(b) };
}

/** Perfect square root: √(n²). Always integer. */
function sqrtTemplate(): MathNode {
    const n = randInt(2, 15);
    return { type: 'sqrt', operand: literal(n * n) };
}

/** Perfect cube root: ∛(n³). Always integer. */
function cbrtTemplate(): MathNode {
    const n = randInt(2, 8);
    return { type: 'cbrt', operand: literal(n * n * n) };
}

/** Integer logarithm: log_base(base^exp). Always integer. */
function logTemplate(): MathNode {
    const base = randInt(2, 5);
    const exp = randInt(1, 5);
    return { type: 'log', base: literal(base), argument: literal(Math.pow(base, exp)) };
}

/** Euler's Totient φ(n). Always integer. */
function totientTemplate(): MathNode {
    const n = randInt(2, 30);
    return { type: 'totient', operand: literal(n) };
}

/** Digit sum S(n). Always integer. */
function digitSumTemplate(): MathNode {
    const n = randInt(100, 9999);
    return { type: 'digitSum', operand: literal(n) };
}

/** Prime counting π(n). Always integer. */
function primeCountingTemplate(): MathNode {
    const n = randInt(10, 50);
    return { type: 'primeCounting', operand: literal(n) };
}

/** Fibonacci F(n) for small n. Always integer. */
function fibonacciTemplate(): MathNode {
    const n = randInt(3, 12);
    return { type: 'fibonacci', operand: literal(n) };
}

/** Absolute value of a subtraction. Always integer. */
function absTemplate(): MathNode {
    const a = randInt(1, 50);
    const b = randInt(1, 50);
    return {
        type: 'abs',
        operand: { type: 'sub', left: literal(a), right: literal(b) },
    };
}

/** All available concept templates. */
const ALL_TEMPLATES: TemplateFunction[] = [
    factorialTemplate,
    powTemplate,
    permTemplate,
    combTemplate,
    gcdTemplate,
    lcmTemplate,
    modTemplate,
    sqrtTemplate,
    cbrtTemplate,
    logTemplate,
    totientTemplate,
    digitSumTemplate,
    primeCountingTemplate,
    fibonacciTemplate,
    absTemplate,
];

// ── Composition ──────────────────────────────────────────────────────

/**
 * Composes an array of MathNode subtrees into a single expression
 * by chaining them with random add/sub operators.
 */
function composeSubtrees(subtrees: MathNode[]): MathNode {
    let result = subtrees[0];
    for (let i = 1; i < subtrees.length; i++) {
        const op = pickRandom(['add', 'sub'] as const);
        result = op === 'add'
            ? add(result, subtrees[i])
            : sub(result, subtrees[i]);
    }
    return result;
}

// ── Public API ───────────────────────────────────────────────────────

export interface GeneratedProblem {
    /** The AST representing the math expression. */
    readonly ast: MathNode;
    /** The correct integer answer. */
    readonly answer: number;
    /** The LaTeX string for rendering. */
    readonly latex: string;
}

/**
 * Generates a random advanced math problem.
 *
 * @param conceptCount Number of concepts to combine (default: random 4–7).
 * @param maxAttempts  Maximum retry attempts (default: 50).
 * @returns A GeneratedProblem with a guaranteed integer answer in ±5000.
 * @throws Error if no valid problem is generated after maxAttempts.
 */
export function generateProblem(
    conceptCount?: number,
    maxAttempts: number = 50,
): GeneratedProblem {
    const count = conceptCount ?? randInt(4, 7);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // 1. Pick random templates (allow repeats for variety)
            const selectedTemplates = shuffle([...ALL_TEMPLATES]).slice(0, count);

            // 2. Generate subtrees
            const subtrees = selectedTemplates.map((fn) => fn());

            // 3. Compose into one expression
            const ast = composeSubtrees(subtrees);

            // 4. Evaluate
            const answer = evaluate(ast);

            // 5. Validate bounds
            if (Math.abs(answer) > 5000) {
                continue;
            }

            // 6. Generate LaTeX
            const latex = toLatex(ast);

            return { ast, answer, latex };
        } catch (error) {
            if (error instanceof EvaluationError) {
                // Expected: non-integer intermediate result. Retry.
                continue;
            }
            throw error;
        }
    }

    throw new Error(`Failed to generate a valid problem after ${maxAttempts} attempts`);
}
