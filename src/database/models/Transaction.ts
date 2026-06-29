import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
    userId: string;
    amount: number;
    type: 'bet' | 'win' | 'refund';
    reason: string;
    gameId: string;
    timestamp: Date;
}

const transactionSchema = new Schema<ITransaction>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['bet', 'win', 'refund'],
        },
        reason: {
            type: String,
            required: true,
        },
        gameId: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

// Index for querying user transaction history
transactionSchema.index({ userId: 1, timestamp: -1 });

export const TransactionModel: Model<ITransaction> = mongoose.model<ITransaction>(
    'Transaction',
    transactionSchema
);
