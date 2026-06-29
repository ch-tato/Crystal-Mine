import { Client, GatewayIntentBits, Events, type Interaction } from 'discord.js';
import 'dotenv/config';

import { gameConfig } from './config/gameConfig.js';
import { InMemoryEconomy } from './database/Economy.js';
import { GameManager } from './game/GameManager.js';
import { createInteractionHandler } from './events/interactionCreate.js';
import { MineEmbedBuilder } from './ui/MineEmbed.js';
import { MineButtonBuilder } from './ui/MineButtons.js';
import { logger } from './utils/logger.js';

import * as mineCommand from './commands/mine.js';
import * as balanceCommand from './commands/balance.js';

// ── Dependency Injection ──────────────────────────────────────────────

const economy = new InMemoryEconomy(gameConfig.defaultBalance);
const gameManager = new GameManager(economy, gameConfig);

// ── Discord Client ────────────────────────────────────────────────────

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// ── Game Expiry Handler ───────────────────────────────────────────────

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

// ── Event Handlers ────────────────────────────────────────────────────

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

// ── Ready ─────────────────────────────────────────────────────────────

client.once(Events.ClientReady, (readyClient) => {
    logger.info('Bot', `Logged in as ${readyClient.user.tag}`);
    logger.info('Bot', `Serving ${readyClient.guilds.cache.size} guild(s)`);
    logger.info('Bot', `Game config:`, gameConfig);
});

// ── Login ─────────────────────────────────────────────────────────────

const token = process.env.DISCORD_TOKEN;
if (!token) {
    logger.error('Bot', 'DISCORD_TOKEN is not set in environment variables');
    process.exit(1);
}

client.login(token).catch((error) => {
    logger.error('Bot', 'Failed to login', error);
    process.exit(1);
});
