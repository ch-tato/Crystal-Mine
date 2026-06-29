export interface TransactionRecord {
    readonly userId: string;
    readonly amount: number;
    readonly type: 'bet' | 'win' | 'refund';
    readonly reason: string;
    readonly timestamp: number;
    readonly gameId: string;
}

export interface IEconomyProvider {
    getBalance(userId: string): Promise<number>;
    addCoins(userId: string, amount: number, reason: string, gameId: string): Promise<number>;
    removeCoins(userId: string, amount: number, reason: string, gameId: string): Promise<number>;
    transactionLog(record: TransactionRecord): Promise<void>;

    /**
     * Attempts to claim an hourly reward.
     * @param userId The discord user ID
     * @param rewardAmount The amount to reward
     * @returns Success status, new balance if successful, and time remaining (ms) if on cooldown
     */
    claimHourly(userId: string, rewardAmount: number): Promise<{ success: boolean; newBalance?: number; timeRemainingMs?: number }>;
}
