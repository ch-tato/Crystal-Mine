import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Message,
    type CacheType,
} from 'discord.js';
import { MineEmbedBuilder } from '../ui/MineEmbed.js';
import { logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available Crystal Mine commands');

export async function execute(
    interaction: ChatInputCommandInteraction<CacheType>
): Promise<void> {
    await interaction.reply({
        embeds: [MineEmbedBuilder.buildHelpEmbed()],
        ephemeral: true, // Ephemeral works for slash commands
    });
}

export async function executePrefix(
    message: Message
): Promise<void> {
    try {
        // Discord does not support ephemeral messages for regular text commands (prefix).
        // To make it private, we must send it via Direct Message (DM).
        await message.author.send({
            embeds: [MineEmbedBuilder.buildHelpEmbed()],
        });

        // Optionally, let them know in the channel
        const reply = await message.reply('I have sent you a DM with the command list!');
        
        // Clean up the channel after a few seconds so it doesn't clutter
        setTimeout(() => {
            reply.delete().catch(() => {});
        }, 5000);
    } catch (error) {
        logger.error('HelpCommand', 'Could not send DM to user', error);
        await message.reply(
            'I tried to DM you the help menu, but your DMs are closed! Please enable DMs from server members.'
        );
    }
}
