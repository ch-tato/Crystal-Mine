import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export async function connectDatabase(uri: string): Promise<void> {
    try {
        await mongoose.connect(uri);
        logger.info('Database', 'Connected to MongoDB successfully');
    } catch (error) {
        logger.error('Database', 'Failed to connect to MongoDB', error);
        process.exit(1);
    }

    mongoose.connection.on('error', (error) => {
        logger.error('Database', 'MongoDB connection error', error);
    });

    mongoose.connection.on('disconnected', () => {
        logger.warn('Database', 'MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
        logger.info('Database', 'MongoDB reconnected');
    });
}

export async function disconnectDatabase(): Promise<void> {
    await mongoose.disconnect();
    logger.info('Database', 'Disconnected from MongoDB');
}
