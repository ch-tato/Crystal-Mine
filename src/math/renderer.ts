/**
 * Server-side LaTeX → PNG renderer.
 *
 * Uses mathjax-node to convert LaTeX to SVG, then svg-png-converter
 * to rasterize the SVG to a PNG buffer that Discord can display.
 */

import mjAPI from 'mathjax-node';
import sharp from 'sharp';

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

    // 2. Change black/currentColor to white for dark theme
    const svgWhite = result.svg
        .replace(/currentColor/g, '#ffffff')
        .replace(/color: ?#000(000)?/gi, 'color: #ffffff')
        .replace(/fill="black"/gi, 'fill="#ffffff"');

    // 3. Convert SVG → PNG buffer using sharp
    //    Use high density for crisp rendering before rasterization
    const pngBuffer = await sharp(Buffer.from(svgWhite), { density: 300 })
        .resize({ width: 800, fit: 'inside' }) 
        .flatten({ background: '#2b2d31' })
        .extend({ top: 40, bottom: 40, left: 40, right: 40, background: '#2b2d31' })
        .png()
        .toBuffer();

    return pngBuffer;
}
