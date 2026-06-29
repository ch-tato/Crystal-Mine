import { Client, GatewayIntentBits, Events, type Interaction } from 'discord.js';
import 'dotenv/config';

import { gameConfig } from './config/gameConfig.js';
import { connectDatabase } from './database/connection.js';
import { MongoEconomy } from './database/MongoEconomy.js';
import { GameManager } from './game/GameManager.js';
import { createInteractionHandler } from './events/interactionCreate.js';
import { MineEmbedBuilder } from './ui/MineEmbed.js';
import { MineButtonBuilder } from './ui/MineButtons.js';
import { logger } from './utils/logger.js';

import * as mineCommand from './commands/mine.js';
import * as balanceCommand from './commands/balance.js';
import * as giveCommand from './commands/give.js';
import * as hourlyCommand from './commands/hourly.js';
import * as questCommand from './commands/quest.js';
import * as mathCommand from './commands/math.js';
import * as adminCommand from './commands/admin.js';
import * as helpCommand from './commands/help.js';

// ── Environment Validation ───────────────────────────────────────────

const token = process.env.DISCORD_TOKEN;
const mongoUri = process.env.MONGODB_URI;

if (!token) {
    logger.error('Bot', 'DISCORD_TOKEN is not set in environment variables');
    process.exit(1);
}

if (!mongoUri) {
    logger.error('Bot', 'MONGODB_URI is not set in environment variables');
    process.exit(1);
}

// ── Bootstrap ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
    // Connect to MongoDB
    await connectDatabase(mongoUri as string);

    // Dependency Injection
    const economy = new MongoEconomy(gameConfig.defaultBalance);
    const gameManager = new GameManager(economy, gameConfig);

    // Discord Client
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
    });

    // ── Game Expiry Handler ───────────────────────────────────────────

    gameManager.setOnGameExpired(async (playerId, state) => {
        try {
            if (!state.channelId || !state.messageId) return;

            const channel = await client.channels.fetch(state.channelId);
            if (!channel || !channel.isTextBased()) return;

            const message = await channel.messages.fetch(state.messageId);
            await message.edit({
                embeds: [MineEmbedBuilder.buildExpiredEmbed(state)],
                components: MineButtonBuilder.buildEndedButtons(state),
            });

            logger.info('Bot', `Updated expired game message for ${playerId}`);
        } catch (error) {
            logger.error('Bot', `Failed to update expired game message for ${playerId}`, error);
        }
    });

    // ── Event Handlers ────────────────────────────────────────────────

    const handleButtonInteraction = createInteractionHandler(gameManager);

    client.on(Events.InteractionCreate, async (interaction: Interaction) => {
        // Slash commands
        if (interaction.isChatInputCommand()) {
            const { commandName } = interaction;

            try {
                switch (commandName) {
                    case 'mine':
                        await mineCommand.execute(interaction, gameManager);
                        break;
                    case 'balance':
                        await balanceCommand.execute(interaction, economy);
                        break;
                    case 'give':
                        await giveCommand.execute(interaction, economy);
                        break;
                    case 'hourly':
                        await hourlyCommand.execute(interaction, economy);
                        break;
                    case 'quest':
                        await questCommand.execute(interaction, economy);
                        break;
                    case 'math':
                        await mathCommand.execute(interaction, economy);
                        break;
                    case 'admin':
                        await adminCommand.execute(interaction, economy);
                        break;
                    case 'help':
                        await helpCommand.execute(interaction);
                        break;
                    default:
                        logger.warn('Bot', `Unknown command: ${commandName}`);
                }
            } catch (error) {
                logger.error('Bot', `Error executing command: ${commandName}`, error);

                const errorEmbed = MineEmbedBuilder.buildErrorEmbed(
                    'An unexpected error occurred. Please try again later.'
                );

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }

            return;
        }

        // Button interactions
        if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
        }
    });

    client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot) return;

        const prefix = 'cm';
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();

        if (!commandName) return;

        try {
            switch (commandName) {
                case 'mine':
                    await mineCommand.executePrefix(message, args, gameManager);
                    break;
                case 'balance':
                    await balanceCommand.executePrefix(message, args, economy);
                    break;
                case 'give':
                    await giveCommand.executePrefix(message, args, economy);
                    break;
                case 'hourly':
                    await hourlyCommand.executePrefix(message, args, economy);
                    break;
                case 'quest':
                    await questCommand.executePrefix(message, args, economy);
                    break;
                case 'math':
                    await mathCommand.executePrefix(message, args, economy);
                    break;
                case 'help':
                    await helpCommand.executePrefix(message);
                    break;
                default:
                    // Unknown prefix command, just ignore
                    break;
            }
        } catch (error) {
            logger.error('Bot', `Error executing prefix command: ${commandName}`, error);
            await message.reply({
                embeds: [MineEmbedBuilder.buildErrorEmbed('An unexpected error occurred. Please try again later.')],
            });
        }
    });

    // ── Ready ─────────────────────────────────────────────────────────

    client.once(Events.ClientReady, (readyClient) => {
        logger.info('Bot', `Logged in as ${readyClient.user.tag}`);
        logger.info('Bot', `Serving ${readyClient.guilds.cache.size} guild(s)`);
        logger.info('Bot', `Game config:`, gameConfig);
    });

    // ── Graceful Shutdown ─────────────────────────────────────────────

    const shutdown = async (signal: string) => {
        logger.info('Bot', `Received ${signal}, shutting down gracefully...`);
        client.destroy();
        const mongoose = await import('mongoose');
        await mongoose.default.disconnect();
        logger.info('Bot', 'Shutdown complete');
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // ── Login ─────────────────────────────────────────────────────────

    await client.login(token);
}

main().catch((error) => {
    logger.error('Bot', 'Fatal error during startup', error);
    process.exit(1);
});
