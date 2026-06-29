/**
 * Server-side LaTeX → PNG renderer.
 *
 * Uses mathjax-node to convert LaTeX to SVG, then svg-png-converter
 * to rasterize the SVG to a PNG buffer that Discord can display.
 */

import mjAPI from 'mathjax-node';
import { svg2png } from 'svg-png-converter';

// ── Initialization ───────────────────────────────────────────────────

let initialized = false;

function ensureInitialized(): void {
    if (initialized) return;
    mjAPI.config({
        MathJax: {
            // No special config needed for basic TeX
        },
    });
    mjAPI.start();
    initialized = true;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Renders a LaTeX expression into a PNG buffer.
 *
 * The image has a dark background (#2b2d31 — Discord's dark theme)
 * with white text for optimal readability in Discord embeds.
 *
 * @param latex The LaTeX expression (without delimiters).
 * @returns A PNG Buffer suitable for Discord AttachmentBuilder.
 */
export async function renderLatexToPng(latex: string): Promise<Buffer> {
    ensureInitialized();

    // 1. Convert LaTeX → SVG via MathJax
    const result = await mjAPI.typeset({
        math: latex,
        format: 'TeX',
        svg: true,
    });

    if (!result.svg) {
        throw new Error('MathJax failed to produce SVG output');
    }

    // 2. Wrap SVG with a dark background and white foreground
    const svgWithStyle = result.svg
        .replace(
            '<svg ',
            '<svg style="background-color: #2b2d31; padding: 20px; border-radius: 8px;" '
        )
        .replace(/currentColor/g, '#ffffff')
        .replace(/color: #000/g, 'color: #ffffff');

    // 3. Convert SVG → PNG buffer
    const pngBuffer = await svg2png({
        input: svgWithStyle,
        encoding: 'buffer',
        format: 'png',
    } as any);

    return pngBuffer as unknown as Buffer;
}
