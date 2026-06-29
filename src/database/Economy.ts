import { IEconomyProvider, TransactionRecord } from '../types/Economy.js';
import { logger } from '../utils/logger.js';

/**
 * In-memory economy provider for development and testing.
 * Replace this with a database-backed implementation for production.
 */
export class InMemoryEconomy implements IEconomyProvider {
    private readonly balances = new Map<string, number>();
    private readonly transactions: TransactionRecord[] = [];
    private readonly defaultBalance: number;

    constructor(defaultBalance: number = 10_000) {
        this.defaultBalance = defaultBalance;
    }

    async getBalance(userId: string): Promise<number> {
        return this.ensureAccount(userId);
    }

    async addCoins(userId: string, amount: number, reason: string, gameId: string): Promise<number> {
        if (amount < 0) throw new Error('Amount must be non-negative');

        const current = this.ensureAccount(userId);
        const newBalance = current + amount;
        this.balances.set(userId, newBalance);

        logger.debug('Economy', `Added ${amount} coins to ${userId}`, { reason, gameId, newBalance });
        return newBalance;
    }

    async removeCoins(userId: string, amount: number, reason: string, gameId: string): Promise<number> {
        if (amount < 0) throw new Error('Amount must be non-negative');

        const current = this.ensureAccount(userId);
        if (current < amount) {
            throw new Error(`Insufficient balance: has ${current}, needs ${amount}`);
        }

        const newBalance = current - amount;
        this.balances.set(userId, newBalance);

        logger.debug('Economy', `Removed ${amount} coins from ${userId}`, { reason, gameId, newBalance });
        return newBalance;
    }

    async transactionLog(record: TransactionRecord): Promise<void> {
        this.transactions.push(record);
    }

    getTransactions(userId?: string): readonly TransactionRecord[] {
        if (userId) {
            return this.transactions.filter((t) => t.userId === userId);
        }
        return [...this.transactions];
    }

    /**
     * Sets a specific balance for a user — useful for testing.
     */
    setBalance(userId: string, balance: number): void {
        this.balances.set(userId, balance);
    }

    private ensureAccount(userId: string): number {
        if (!this.balances.has(userId)) {
            this.balances.set(userId, this.defaultBalance);
            logger.info('Economy', `Created account for ${userId} with ${this.defaultBalance} coins`);
        }
        return this.balances.get(userId)!;
    }
}
