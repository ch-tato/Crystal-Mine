/**
 * Converts a MathNode AST into a LaTeX string for rendering.
 *
 * Each node type maps to its standard mathematical notation.
 * Parentheses are added conservatively to ensure clarity.
 */

import type { MathNode } from './ast.js';

/**
 * Determines if a node needs wrapping in parentheses when used
 * as a child of a binary arithmetic operator.
 */
function needsParens(node: MathNode, parentType: 'add' | 'sub' | 'mul'): boolean {
    if (node.type === 'add' || node.type === 'sub') {
        return parentType === 'mul';
    }
    if (node.type === 'literal' && node.value < 0) {
        return true;
    }
    return false;
}

/** Wraps a LaTeX string in parentheses if needed. */
function wrapIfNeeded(node: MathNode, parentType: 'add' | 'sub' | 'mul'): string {
    const latex = toLatex(node);
    return needsParens(node, parentType) ? `\\left(${latex}\\right)` : latex;
}

/**
 * Recursively converts a MathNode AST into a LaTeX string.
 */
export function toLatex(node: MathNode): string {
    switch (node.type) {
        case 'literal':
            return node.value.toString();

        case 'factorial':
            if (node.operand.type === 'literal') {
                return `${node.operand.value}!`;
            }
            return `\\left(${toLatex(node.operand)}\\right)!`;

        case 'abs':
            return `\\left|${toLatex(node.operand)}\\right|`;

        case 'sqrt':
            return `\\sqrt{${toLatex(node.operand)}}`;

        case 'cbrt':
            return `\\sqrt[3]{${toLatex(node.operand)}}`;

        case 'pow':
            if (node.base.type === 'literal' && node.base.value >= 0) {
                return `${node.base.value}^{${toLatex(node.exponent)}}`;
            }
            return `\\left(${toLatex(node.base)}\\right)^{${toLatex(node.exponent)}}`;

        case 'mod':
            return `${toLatex(node.left)} \\bmod ${toLatex(node.right)}`;

        case 'gcd':
            return `\\gcd\\left(${toLatex(node.a)},\\, ${toLatex(node.b)}\\right)`;

        case 'lcm':
            return `\\text{lcm}\\left(${toLatex(node.a)},\\, ${toLatex(node.b)}\\right)`;

        case 'perm':
            return `P\\left(${toLatex(node.n)},\\, ${toLatex(node.r)}\\right)`;

        case 'comb':
            return `\\binom{${toLatex(node.n)}}{${toLatex(node.r)}}`;

        case 'log':
            return `\\log_{${toLatex(node.base)}}\\!\\left(${toLatex(node.argument)}\\right)`;

        case 'totient':
            return `\\varphi\\!\\left(${toLatex(node.operand)}\\right)`;

        case 'digitSum':
            return `S\\!\\left(${toLatex(node.operand)}\\right)`;

        case 'primeCounting':
            return `\\pi\\!\\left(${toLatex(node.operand)}\\right)`;

        case 'fibonacci':
            return `F_{${toLatex(node.operand)}}`;

        case 'add':
            return `${wrapIfNeeded(node.left, 'add')} + ${wrapIfNeeded(node.right, 'add')}`;

        case 'sub':
            return `${wrapIfNeeded(node.left, 'sub')} - ${wrapIfNeeded(node.right, 'sub')}`;

        case 'mul':
            return `${wrapIfNeeded(node.left, 'mul')} \\times ${wrapIfNeeded(node.right, 'mul')}`;

        default: {
            const _exhaustive: never = node;
            throw new Error(`Unknown node type: ${(_exhaustive as any).type}`);
        }
    }
}
