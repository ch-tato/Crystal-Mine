import { IEconomyProvider, TransactionRecord } from '../types/Economy.js';
import { UserModel } from './models/User.js';
import { TransactionModel } from './models/Transaction.js';
import { logger } from '../utils/logger.js';

/**
 * Production economy provider backed by MongoDB.
 * Implements IEconomyProvider for seamless swap with InMemoryEconomy.
 */
export class MongoEconomy implements IEconomyProvider {
    private readonly defaultBalance: number;

    constructor(defaultBalance: number = 10_000) {
        this.defaultBalance = defaultBalance;
    }

    async getBalance(userId: string): Promise<number> {
        const user = await this.ensureUser(userId);
        return user.balance;
    }

    async addCoins(userId: string, amount: number, reason: string, gameId: string): Promise<number> {
        if (amount < 0) throw new Error('Amount must be non-negative');

        const user = await this.ensureUser(userId);
        user.balance += amount;
        await user.save();

        logger.debug('MongoEconomy', `Added ${amount} coins to ${userId}`, {
            reason,
            gameId,
            newBalance: user.balance,
        });

        return user.balance;
    }

    async removeCoins(userId: string, amount: number, reason: string, gameId: string): Promise<number> {
        if (amount < 0) throw new Error('Amount must be non-negative');

        const user = await this.ensureUser(userId);
        if (user.balance < amount) {
            throw new Error(`Insufficient balance: has ${user.balance}, needs ${amount}`);
        }

        user.balance -= amount;
        await user.save();

        logger.debug('MongoEconomy', `Removed ${amount} coins from ${userId}`, {
            reason,
            gameId,
            newBalance: user.balance,
        });

        return user.balance;
    }

    async transactionLog(record: TransactionRecord): Promise<void> {
        await TransactionModel.create({
            userId: record.userId,
            amount: record.amount,
            type: record.type,
            reason: record.reason,
            gameId: record.gameId,
            timestamp: new Date(record.timestamp),
        });
    }

    /**
     * Sets an exact balance for a user. Used by admin commands.
     */
    async setBalance(userId: string, balance: number): Promise<number> {
        if (balance < 0) throw new Error('Balance cannot be negative');

        const user = await this.ensureUser(userId);
        user.balance = balance;
        await user.save();

        logger.info('MongoEconomy', `Set balance for ${userId} to ${balance}`);
        return user.balance;
    }

    /**
     * Resets a user's balance to the default starting amount.
     */
    async resetBalance(userId: string): Promise<number> {
        return this.setBalance(userId, this.defaultBalance);
    }

    private async ensureUser(userId: string) {
        let user = await UserModel.findOne({ discordId: userId });
        if (!user) {
            user = await UserModel.create({
                discordId: userId,
                balance: this.defaultBalance,
            });
            logger.info('MongoEconomy', `Created account for ${userId} with ${this.defaultBalance} coins`);
        }
        return user;
    }
}
