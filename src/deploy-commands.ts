import { REST, Routes } from 'discord.js';
import 'dotenv/config';

import * as mineCommand from './commands/mine.js';
import * as balanceCommand from './commands/balance.js';
import * as adminCommand from './commands/admin.js';
import * as helpCommand from './commands/help.js';
import { logger } from './utils/logger.js';

const commands = [
    mineCommand.data.toJSON(),
    balanceCommand.data.toJSON(),
    adminCommand.data.toJSON(),
    helpCommand.data.toJSON(),
];

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
    logger.error('Deploy', 'DISCORD_TOKEN and CLIENT_ID must be set in .env');
    process.exit(1);
}

const validToken: string = token;
const validClientId: string = clientId;
const rest = new REST({ version: '10' }).setToken(validToken);

async function deploy(): Promise<void> {
    try {
        logger.info('Deploy', `Registering ${commands.length} command(s)...`);

        if (guildId) {
            // Guild-specific (instant, good for development)
            await rest.put(Routes.applicationGuildCommands(validClientId, guildId), {
                body: commands,
            });
            logger.info('Deploy', `Registered commands to guild ${guildId}`);
        } else {
            // Global (takes up to 1 hour to propagate)
            await rest.put(Routes.applicationCommands(validClientId), {
                body: commands,
            });
            logger.info('Deploy', 'Registered global commands (may take up to 1h to propagate)');
        }

        logger.info('Deploy', 'Done!');
    } catch (error) {
        logger.error('Deploy', 'Failed to register commands', error);
        process.exit(1);
    }
}

deploy();
