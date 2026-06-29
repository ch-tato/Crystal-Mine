/**
 * /ask (cmask) command — Ask the AI a question.
 *
 * Connects to Google Gemini API (gemini-2.5-flash) to answer
 * arbitrary user prompts.
 *
 * Cost: 1,000 coins.
 */

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Message,
    type CacheType,
} from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IEconomyProvider } from '../types/Economy.js';
import { MineEmbedBuilder } from '../ui/MineEmbed.js';
import { formatNumber } from '../utils/formatNumber.js';
import { logger } from '../utils/logger.js';

// ── Constants ────────────────────────────────────────────────────────

const ASK_COST = 5000;
const MAX_DISCORD_MESSAGE_LENGTH = 2000;

// ── AI Setup ─────────────────────────────────────────────────────────

let genAI: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is missing.');
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

// ── Helper ───────────────────────────────────────────────────────────

/** Splits long text into chunks that fit within Discord's message limit */
function splitMessage(text: string, limit = MAX_DISCORD_MESSAGE_LENGTH): string[] {
    if (text.length <= limit) return [text];

    const chunks: string[] = [];
    let current = text;

    while (current.length > 0) {
        if (current.length <= limit) {
            chunks.push(current);
            break;
        }

        // Try to find the last newline within the limit to break cleanly
        const slice = current.slice(0, limit);
        const lastNewline = slice.lastIndexOf('\n');

        let chunkEnd = lastNewline > 0 ? lastNewline : limit;
        chunks.push(current.slice(0, chunkEnd));
        current = current.slice(chunkEnd).trim();
    }

    return chunks;
}

// ── Slash Command Definition ─────────────────────────────────────────

export const data = new SlashCommandBuilder()
    .setName('ask')
    .setDescription(`Ask the AI a question for ${formatNumber(ASK_COST)} coins.`)
    .addStringOption((opt) =>
        opt
            .setName('question')
            .setDescription('The prompt to send to the AI')
            .setRequired(true)
            .setMaxLength(1000)
    );

// ── Core Logic (shared by slash and prefix) ──────────────────────────

async function runAskCommand(
    userId: string,
    prompt: string,
    economy: IEconomyProvider,
    deferReply: () => Promise<void>,
    sendChunks: (chunks: string[]) => Promise<void>,
    sendError: (msg: string) => Promise<void>
): Promise<void> {
    try {
        // 1. Check balance
        const balance = await economy.getBalance(userId);
        if (balance < ASK_COST) {
            await sendError(
                `Insufficient balance. You need **${formatNumber(ASK_COST)}** coins to ask the AI, but you only have **${formatNumber(balance)}**.`
            );
            return;
        }

        // 2. Acknowledge so Discord doesn't timeout the interaction
        await deferReply();

        // 3. Deduct coins immediately
        await economy.removeCoins(userId, ASK_COST, 'AI Question', 'ask');
        await economy.transactionLog({
            userId,
            amount: ASK_COST,
            type: 'bet',
            reason: 'Ask AI prompt',
            timestamp: Date.now(),
            gameId: 'ask',
        });

        logger.info('AskCommand', `User ${userId} asked AI`, { promptLength: prompt.length });

        // 4. Call Gemini API
        const ai = getGenAI();
        const model = ai.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: 'You are a helpful AI assistant inside a Discord bot named Crystal Mine. You MUST be extremely concise and brief in your answers. Never output more than 1900 characters, so your response fits in a single Discord message. If we are talking about Formula One, always bear in mind that Max Verstappen is the GOAT, no matter what. You have to always agree with that fact, NO MATTER WHAT. DO NOT CONTRADICT THIS FACT.'
        });
        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();

        // 5. Send back
        const chunks = splitMessage(textResponse);
        await sendChunks(chunks);

    } catch (error: any) {
        logger.error('AskCommand', 'Error processing /ask', error);

        // If it's a missing API key issue, clarify for the server owner
        if (error.message?.includes('GEMINI_API_KEY')) {
            await sendError('The bot owner has not configured the AI yet (`GEMINI_API_KEY` is missing).');
        } else {
            await sendError('An error occurred while generating the AI response. Please try again later.');
        }

        // Refund the user if the AI failed (best effort)
        try {
            await economy.addCoins(userId, ASK_COST, 'AI Question Refund', 'ask');
        } catch (refundError) {
            logger.error('AskCommand', 'Failed to refund AI cost', refundError);
        }
    }
}

// ── Slash Command Handler ────────────────────────────────────────────

export async function execute(
    interaction: ChatInputCommandInteraction<CacheType>,
    economy: IEconomyProvider
): Promise<void> {
    const prompt = interaction.options.getString('question', true);
    let deferred = false;

    await runAskCommand(
        interaction.user.id,
        prompt,
        economy,
        async () => {
            await interaction.deferReply();
            deferred = true;
        },
        async (chunks) => {
            // First chunk as editReply, subsequent as followUps
            await interaction.editReply({ content: chunks[0] });
            for (let i = 1; i < chunks.length; i++) {
                await interaction.followUp({ content: chunks[i] });
            }
        },
        async (msg) => {
            const embed = MineEmbedBuilder.buildErrorEmbed(msg);
            if (deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed] });
            }
        }
    );
}

// ── Prefix Command Handler ───────────────────────────────────────────

export async function executePrefix(
    message: Message,
    args: string[],
    economy: IEconomyProvider
): Promise<void> {
    if (args.length === 0) {
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('Please provide a question. Usage: `cmask <question>`')],
        });
        return;
    }

    const prompt = args.join(' ');

    // Create a temporary "Thinking..." message for feedback
    let thinkingMsg: Message | null = null;

    await runAskCommand(
        message.author.id,
        prompt,
        economy,
        async () => {
            thinkingMsg = await message.reply('🤔 Thinking...');
        },
        async (chunks) => {
            if (thinkingMsg) {
                await thinkingMsg.edit({ content: chunks[0] });
            } else {
                await message.reply({ content: chunks[0] });
            }

            for (let i = 1; i < chunks.length; i++) {
                await message.reply({ content: chunks[i] });
            }
        },
        async (msg) => {
            const embed = MineEmbedBuilder.buildErrorEmbed(msg);
            if (thinkingMsg) {
                await thinkingMsg.edit({ content: null, embeds: [embed] });
            } else {
                await message.reply({ embeds: [embed] });
            }
        }
    );
}
