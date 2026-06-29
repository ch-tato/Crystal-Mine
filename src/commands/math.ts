/**
 * /math (cmmath) command — Advanced math challenge.
 *
 * Generates a very hard math problem rendered as a LaTeX image,
 * gives the user 60 seconds to answer, and awards 100,000 coins
 * for a correct response.
 *
 * Cooldown: 1 minute, starts AFTER the challenge ends.
 */

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    AttachmentBuilder,
    Message,
    type CacheType,
} from 'discord.js';
import { IEconomyProvider } from '../types/Economy.js';
import { MineEmbedBuilder } from '../ui/MineEmbed.js';
import { formatNumber } from '../utils/formatNumber.js';
import { logger } from '../utils/logger.js';
import { generateProblem } from '../math/generator.js';
import { renderLatexToPng } from '../math/renderer.js';
import { MathSessionManager } from '../math/sessionManager.js';

// ── Constants ────────────────────────────────────────────────────────

const MATH_REWARD = 100_000;
const ANSWER_TIME_MS = 60_000;

// ── Shared Session Manager (singleton) ───────────────────────────────

const sessionManager = new MathSessionManager(1 * 60 * 1000); // 1 min cooldown

// ── Slash Command Definition ─────────────────────────────────────────

export const data = new SlashCommandBuilder()
    .setName('math')
    .setDescription(`Solve an advanced math challenge for ${formatNumber(MATH_REWARD)} coins! (60 seconds)`);

// ── Core Logic (shared by slash and prefix) ──────────────────────────

async function runMathChallenge(
    userId: string,
    userTag: string,
    sendQuestion: (embed: any, attachment: AttachmentBuilder) => Promise<void>,
    sendResult: (embed: any) => Promise<void>,
    createCollector: (timeMs: number) => any,
    economy: IEconomyProvider,
): Promise<void> {
    // 1. Generate problem
    const problem = generateProblem();
    logger.info('MathCommand', `Generated problem for ${userTag}: answer=${problem.answer}`);

    // 2. Render LaTeX → PNG
    const pngBuffer = await renderLatexToPng(problem.latex);
    const attachment = new AttachmentBuilder(pngBuffer, { name: 'math.png' });

    // 3. Register active session
    sessionManager.startSession(userId, problem.answer);

    // 4. Build and send the question embed
    const questionEmbed = MineEmbedBuilder.buildInfoEmbed(
        '🧮 Advanced Math Challenge',
        [
            `**Reward:** ${formatNumber(MATH_REWARD)} coins`,
            `**Time Limit:** ${ANSWER_TIME_MS / 1000} seconds`,
            '',
            `*Where S(n) = digit sum, φ(n) = Euler\\'s totient, π(n) = prime count, F_n = Fibonacci*`,
            '',
            '*Type your integer answer in the chat!*',
        ].join('\n'),
    );
    questionEmbed.setImage('attachment://math.png');

    await sendQuestion(questionEmbed, attachment);

    // 5. Collect answer
    const collector = createCollector(ANSWER_TIME_MS);

    collector.on('collect', async (m: Message) => {
        const userAnswer = parseInt(m.content.trim(), 10);

        if (isNaN(userAnswer)) {
            // Non-numeric input counts as wrong answer
            await sendResult(MineEmbedBuilder.buildErrorEmbed(
                `❌ That's not a number!\n\nThe correct answer was: **${problem.answer}**`,
            ));
        } else if (userAnswer === problem.answer) {
            // Correct!
            await economy.addCoins(userId, MATH_REWARD, 'Math Challenge', 'math');
            await economy.transactionLog({
                userId,
                amount: MATH_REWARD,
                type: 'win',
                reason: 'Solved advanced math challenge',
                timestamp: Date.now(),
                gameId: 'math',
            });

            const newBalance = await economy.getBalance(userId);
            await sendResult(MineEmbedBuilder.buildSuccessEmbed(
                '🎉 Correct!',
                `You solved it and earned **${formatNumber(MATH_REWARD)}** coins!\nNew balance: **${formatNumber(newBalance)}** coins.`,
            ));
            logger.info('MathCommand', `${userTag} solved the math challenge correctly`);
        } else {
            // Wrong answer
            await sendResult(MineEmbedBuilder.buildErrorEmbed(
                `❌ Incorrect! You answered **${userAnswer}**.\n\nThe correct answer was: **${problem.answer}**`,
            ));
        }
    });

    collector.on('end', async (collected: any, reason: string) => {
        // Always clean up session and set cooldown when the challenge ends
        sessionManager.endSession(userId);
        sessionManager.setCooldown(userId);

        if (reason === 'time') {
            await sendResult(MineEmbedBuilder.buildExpiredMessageEmbed(
                `⏳ Time's up!\n\nThe correct answer was: **${problem.answer}**`,
            ));
        }
    });
}

// ── Slash Command Handler ────────────────────────────────────────────

export async function execute(
    interaction: ChatInputCommandInteraction<CacheType>,
    economy: IEconomyProvider,
): Promise<void> {
    const userId = interaction.user.id;

    // Check active session
    if (sessionManager.hasActiveSession(userId)) {
        await interaction.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('You already have an active math challenge!')],
            ephemeral: true,
        });
        return;
    }

    // Check cooldown
    const cooldown = sessionManager.checkCooldown(userId);
    if (cooldown.onCooldown) {
        const minutes = Math.floor(cooldown.remainingMs / 60000);
        const seconds = Math.ceil((cooldown.remainingMs % 60000) / 1000);
        await interaction.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed(
                `You need to wait **${minutes}m ${seconds}s** before starting another math challenge.`,
            )],
            ephemeral: true,
        });
        return;
    }

    await interaction.deferReply();

    try {
        const channel = interaction.channel;
        if (!channel) return;

        await runMathChallenge(
            userId,
            interaction.user.tag,
            async (embed, attachment) => {
                await interaction.editReply({
                    embeds: [embed],
                    files: [attachment],
                });
            },
            async (embed) => {
                await interaction.followUp({ embeds: [embed] });
            },
            (timeMs: number) => {
                const filter = (m: Message) => m.author.id === userId;
                return (channel as any).createMessageCollector({
                    filter,
                    time: timeMs,
                    max: 1,
                });
            },
            economy,
        );
    } catch (error) {
        sessionManager.endSession(userId);
        logger.error('MathCommand', 'Failed to run math challenge', error);
        await interaction.editReply({
            embeds: [MineEmbedBuilder.buildErrorEmbed(
                'Failed to generate the math challenge. Please try again later.',
            )],
        });
    }
}

// ── Prefix Command Handler ───────────────────────────────────────────

export async function executePrefix(
    message: Message,
    _args: string[],
    economy: IEconomyProvider,
): Promise<void> {
    const userId = message.author.id;

    // Check active session
    if (sessionManager.hasActiveSession(userId)) {
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('You already have an active math challenge!')],
        });
        return;
    }

    // Check cooldown
    const cooldown = sessionManager.checkCooldown(userId);
    if (cooldown.onCooldown) {
        const minutes = Math.floor(cooldown.remainingMs / 60000);
        const seconds = Math.ceil((cooldown.remainingMs % 60000) / 1000);
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed(
                `You need to wait **${minutes}m ${seconds}s** before starting another math challenge.`,
            )],
        });
        return;
    }

    try {
        const channel = message.channel;

        await runMathChallenge(
            userId,
            message.author.tag,
            async (embed, attachment) => {
                await message.reply({
                    embeds: [embed],
                    files: [attachment],
                });
            },
            async (embed) => {
                await (channel as any).send({
                    content: `<@${userId}>`,
                    embeds: [embed],
                });
            },
            (timeMs: number) => {
                const filter = (m: Message) => m.author.id === userId;
                return (channel as any).createMessageCollector({
                    filter,
                    time: timeMs,
                    max: 1,
                });
            },
            economy,
        );
    } catch (error) {
        sessionManager.endSession(userId);
        logger.error('MathCommand', 'Failed to run prefix math challenge', error);
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed(
                'Failed to generate the math challenge. Please try again later.',
            )],
        });
    }
}
