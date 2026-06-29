/**
 * Barrel exports for the math engine.
 */

export { type MathNode, literal, add, sub, mul } from './ast.js';
export { evaluate, EvaluationError } from './evaluator.js';
export {
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
} from './evaluator.js';
export { toLatex } from './latex.js';
export { generateProblem, type GeneratedProblem } from './generator.js';
export { renderLatexToPng } from './renderer.js';
export { MathSessionManager, type MathSession } from './sessionManager.js';
