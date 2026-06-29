import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    discordId: string;
    balance: number;
    lastHourlyClaim?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        discordId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        balance: {
            type: Number,
            required: true,
            default: 10_000,
            min: 0,
        },
        lastHourlyClaim: {
            type: Date,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

export const UserModel: Model<IUser> = mongoose.model<IUser>('User', userSchema);
