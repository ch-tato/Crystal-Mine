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
}
