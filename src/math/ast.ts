/**
 * Abstract Syntax Tree node definitions for the math expression engine.
 *
 * Each node type represents a mathematical operation or value.
 * The AST is used by the evaluator (to compute the answer),
 * the LaTeX renderer (to produce a formatted string), and
 * the generator (to compose problems from templates).
 */

// ── Unary Operations ─────────────────────────────────────────────────

export interface LiteralNode {
    readonly type: 'literal';
    readonly value: number;
}

export interface FactorialNode {
    readonly type: 'factorial';
    readonly operand: MathNode;
}

export interface AbsNode {
    readonly type: 'abs';
    readonly operand: MathNode;
}

export interface SqrtNode {
    readonly type: 'sqrt';
    readonly operand: MathNode;
}

export interface CbrtNode {
    readonly type: 'cbrt';
    readonly operand: MathNode;
}

export interface TotientNode {
    readonly type: 'totient';
    readonly operand: MathNode;
}

export interface DigitSumNode {
    readonly type: 'digitSum';
    readonly operand: MathNode;
}

export interface PrimeCountingNode {
    readonly type: 'primeCounting';
    readonly operand: MathNode;
}

export interface FibonacciNode {
    readonly type: 'fibonacci';
    readonly operand: MathNode;
}

// ── Binary Operations ────────────────────────────────────────────────

export interface PowNode {
    readonly type: 'pow';
    readonly base: MathNode;
    readonly exponent: MathNode;
}

export interface ModNode {
    readonly type: 'mod';
    readonly left: MathNode;
    readonly right: MathNode;
}

export interface GcdNode {
    readonly type: 'gcd';
    readonly a: MathNode;
    readonly b: MathNode;
}

export interface LcmNode {
    readonly type: 'lcm';
    readonly a: MathNode;
    readonly b: MathNode;
}

export interface PermNode {
    readonly type: 'perm';
    readonly n: MathNode;
    readonly r: MathNode;
}

export interface CombNode {
    readonly type: 'comb';
    readonly n: MathNode;
    readonly r: MathNode;
}

export interface LogNode {
    readonly type: 'log';
    readonly base: MathNode;
    readonly argument: MathNode;
}

export interface AddNode {
    readonly type: 'add';
    readonly left: MathNode;
    readonly right: MathNode;
}

export interface SubNode {
    readonly type: 'sub';
    readonly left: MathNode;
    readonly right: MathNode;
}

export interface MulNode {
    readonly type: 'mul';
    readonly left: MathNode;
    readonly right: MathNode;
}

// ── Union Type ───────────────────────────────────────────────────────

export type MathNode =
    | LiteralNode
    | FactorialNode
    | AbsNode
    | SqrtNode
    | CbrtNode
    | TotientNode
    | DigitSumNode
    | PrimeCountingNode
    | FibonacciNode
    | PowNode
    | ModNode
    | GcdNode
    | LcmNode
    | PermNode
    | CombNode
    | LogNode
    | AddNode
    | SubNode
    | MulNode;

// ── Factory Helpers ──────────────────────────────────────────────────

/** Creates a literal value node. */
export function literal(value: number): LiteralNode {
    return { type: 'literal', value };
}

/** Creates an addition node. */
export function add(left: MathNode, right: MathNode): AddNode {
    return { type: 'add', left, right };
}

/** Creates a subtraction node. */
export function sub(left: MathNode, right: MathNode): SubNode {
    return { type: 'sub', left, right };
}

/** Creates a multiplication node. */
export function mul(left: MathNode, right: MathNode): MulNode {
    return { type: 'mul', left, right };
}
