import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Message,
    type CacheType,
} from 'discord.js';
import { IEconomyProvider } from '../types/Economy.js';
import { MineEmbedBuilder } from '../ui/MineEmbed.js';
import { formatNumber } from '../utils/formatNumber.js';
import { logger } from '../utils/logger.js';
import he from 'he'; // Need to decode HTML entities from OpenTDB

type Difficulty = 'easy' | 'medium' | 'hard';

const QUEST_CONFIG: Record<Difficulty, { reward: number; timeMs: number }> = {
    easy: { reward: 1000, timeMs: 30_000 },
    medium: { reward: 5000, timeMs: 20_000 },
    hard: { reward: 10000, timeMs: 15_000 },
};

export const data = new SlashCommandBuilder()
    .setName('quest')
    .setDescription('Start a trivia quest to earn coins')
    .addStringOption((option) =>
        option
            .setName('difficulty')
            .setDescription('Choose your difficulty')
            .setRequired(true)
            .addChoices(
                { name: 'Easy (1,000 coins, 30s)', value: 'easy' },
                { name: 'Medium (5,000 coins, 20s)', value: 'medium' },
                { name: 'Hard (10,000 coins, 15s)', value: 'hard' }
            )
    );

const questCooldowns = new Map<string, number>();
const QUEST_COOLDOWN_MS = 30_000; // 30 seconds

function checkCooldown(userId: string): { onCooldown: boolean; remainingMs: number } {
    const lastUse = questCooldowns.get(userId) || 0;
    const now = Date.now();
    if (now - lastUse < QUEST_COOLDOWN_MS) {
        return { onCooldown: true, remainingMs: QUEST_COOLDOWN_MS - (now - lastUse) };
    }
    return { onCooldown: false, remainingMs: 0 };
}

function setCooldown(userId: string) {
    questCooldowns.set(userId, Date.now());
}

// Helper to fetch a question from OpenTDB
async function fetchTriviaQuestion(difficulty: Difficulty) {
    let attempts = 0;
    while (attempts < 10) {
        attempts++;
        const response = await fetch(`https://opentdb.com/api.php?amount=1&difficulty=${difficulty}&type=multiple`);
        const data = (await response.json()) as any;

        if (!data.results || data.results.length === 0) continue;

        const questionData = data.results[0];
        const question = he.decode(questionData.question);

        // Filter out questions that don't make sense without choices
        const lowerQ = question.toLowerCase();
        if (
            lowerQ.includes('which of these') ||
            lowerQ.includes('which of the following') ||
            lowerQ.includes('which one of these')
        ) {
            continue;
        }

        return {
            category: he.decode(questionData.category),
            question: question,
            correctAnswer: he.decode(questionData.correct_answer),
        };
    }
    
    throw new Error('Failed to find a suitable trivia question.');
}

// Helper to check if string matches (lenient on case and trailing spaces)
function isAnswerCorrect(userInput: string, correctAnswer: string): boolean {
    const cleanUser = userInput.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    const cleanCorrect = correctAnswer.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    
    return cleanUser === cleanCorrect;
}

export async function execute(
    interaction: ChatInputCommandInteraction<CacheType>,
    economy: IEconomyProvider
): Promise<void> {
    const difficulty = interaction.options.getString('difficulty', true) as Difficulty;
    const config = QUEST_CONFIG[difficulty];
    const userId = interaction.user.id;

    const cooldown = checkCooldown(userId);
    if (cooldown.onCooldown) {
        await interaction.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed(`You are doing quests too fast! Please wait **${Math.ceil(cooldown.remainingMs / 1000)}s** before starting another quest.`)],
            ephemeral: true,
        });
        return;
    }
    setCooldown(userId);

    await interaction.deferReply(); // API call might take a second

    try {
        const trivia = await fetchTriviaQuestion(difficulty);

        const embed = MineEmbedBuilder.buildInfoEmbed(
            `🧠 Trivia Quest: ${difficulty.toUpperCase()}`,
            `**Category:** ${trivia.category}\n\n**Question:** ${trivia.question}\n\n*Type your answer in the chat! You have ${config.timeMs / 1000} seconds.*`
        );

        await interaction.editReply({ embeds: [embed] });

        const channel = interaction.channel;
        if (!channel) return;

        const filter = (m: Message) => m.author.id === userId;
        const collector = (channel as any).createMessageCollector({ filter, time: config.timeMs, max: 1 });

        collector.on('collect', async (m: Message) => {
            if (isAnswerCorrect(m.content, trivia.correctAnswer)) {
                // Correct
                await economy.addCoins(userId, config.reward, `Trivia Quest (${difficulty})`, 'quest');
                await economy.transactionLog({
                    userId,
                    amount: config.reward,
                    type: 'win',
                    reason: `Completed ${difficulty} trivia quest`,
                    timestamp: Date.now(),
                    gameId: 'quest',
                });
                
                await m.reply({
                    embeds: [MineEmbedBuilder.buildSuccessEmbed(
                        '🎉 Correct!',
                        `You answered correctly and earned **${formatNumber(config.reward)}** coins!`
                    )]
                });
            } else {
                // Incorrect
                await m.reply({
                    embeds: [MineEmbedBuilder.buildErrorEmbed(
                        `❌ Incorrect!\n\nThe correct answer was: **${trivia.correctAnswer}**`
                    )]
                });
            }
        });

        collector.on('end', async (collected: any, reason: string) => {
            if (reason === 'time') {
                await interaction.followUp({
                    embeds: [MineEmbedBuilder.buildExpiredMessageEmbed(
                        `⏳ Time's up!\n\nThe correct answer was: **${trivia.correctAnswer}**`
                    )]
                });
            }
        });

    } catch (error) {
        logger.error('QuestCommand', 'Failed to run quest', error);
        await interaction.editReply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('Failed to connect to the trivia database. Please try again later.')]
        });
    }
}

export async function executePrefix(
    message: Message,
    args: string[],
    economy: IEconomyProvider
): Promise<void> {
    if (args.length < 1 || !['easy', 'medium', 'hard'].includes(args[0].toLowerCase())) {
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('Please specify a difficulty: `cmquest <easy|medium|hard>`')]
        });
        return;
    }

    const difficulty = args[0].toLowerCase() as Difficulty;
    const config = QUEST_CONFIG[difficulty];
    const userId = message.author.id;

    const cooldown = checkCooldown(userId);
    if (cooldown.onCooldown) {
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed(`You are doing quests too fast! Please wait **${Math.ceil(cooldown.remainingMs / 1000)}s** before starting another quest.`)]
        });
        return;
    }
    setCooldown(userId);

    try {
        const trivia = await fetchTriviaQuestion(difficulty);

        const embed = MineEmbedBuilder.buildInfoEmbed(
            `🧠 Trivia Quest: ${difficulty.toUpperCase()}`,
            `**Category:** ${trivia.category}\n\n**Question:** ${trivia.question}\n\n*Type your answer in the chat! You have ${config.timeMs / 1000} seconds.*`
        );

        await message.reply({ embeds: [embed] });

        const channel = message.channel;
        const filter = (m: Message) => m.author.id === userId;
        const collector = (channel as any).createMessageCollector({ filter, time: config.timeMs, max: 1 });

        collector.on('collect', async (m: Message) => {
            if (isAnswerCorrect(m.content, trivia.correctAnswer)) {
                // Correct
                await economy.addCoins(userId, config.reward, `Trivia Quest (${difficulty})`, 'quest');
                await economy.transactionLog({
                    userId,
                    amount: config.reward,
                    type: 'win',
                    reason: `Completed ${difficulty} trivia quest`,
                    timestamp: Date.now(),
                    gameId: 'quest',
                });
                
                await m.reply({
                    embeds: [MineEmbedBuilder.buildSuccessEmbed(
                        '🎉 Correct!',
                        `You answered correctly and earned **${formatNumber(config.reward)}** coins!`
                    )]
                });
            } else {
                // Incorrect
                await m.reply({
                    embeds: [MineEmbedBuilder.buildErrorEmbed(
                        `❌ Incorrect!\n\nThe correct answer was: **${trivia.correctAnswer}**`
                    )]
                });
            }
        });

        collector.on('end', async (collected: any, reason: string) => {
            if (reason === 'time') {
                await (message.channel as any).send({
                    content: `<@${userId}>`,
                    embeds: [MineEmbedBuilder.buildExpiredMessageEmbed(
                        `⏳ Time's up!\n\nThe correct answer was: **${trivia.correctAnswer}**`
                    )]
                });
            }
        });

    } catch (error) {
        logger.error('QuestCommand', 'Failed to run prefix quest', error);
        await message.reply({
            embeds: [MineEmbedBuilder.buildErrorEmbed('Failed to connect to the trivia database. Please try again later.')]
        });
    }
}
