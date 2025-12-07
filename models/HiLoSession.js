import mongoose from "mongoose";

const hiLoSessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        wagerAmount: {
            type: Number,
            required: true,
            min: 20,
        },
        currentAmount: {
            type: Number,
            required: true,
        },
        currentCard: {
            suit: { type: String, enum: ["hearts", "diamonds", "clubs", "spades"] },
            rank: { type: Number, min: 1, max: 13 }, // 1=Ace, 11=Jack, 12=Queen, 13=King
        },
        deck: [{
            suit: { type: String, enum: ["hearts", "diamonds", "clubs", "spades"] },
            rank: { type: Number, min: 1, max: 13 },
        }],
        consecutiveWins: {
            type: Number,
            default: 0,
        },
        currentMultiplier: {
            type: Number,
            default: 1.05,
        },
        gameHistory: [{
            card: {
                suit: String,
                rank: Number,
            },
            guess: { type: String, enum: ["higher", "lower", "same"] },
            nextCard: {
                suit: String,
                rank: Number,
            },
            wasCorrect: Boolean,
            multiplier: Number,
            amountBefore: Number,
            amountAfter: Number,
            timestamp: { type: Date, default: Date.now },
        }],
        status: {
            type: String,
            enum: ["active", "cashed_out", "lost", "abandoned"],
            default: "active",
        },
        finalAmount: {
            type: Number,
            default: 0,
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        endedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

const HiLoSession = mongoose.model("HiLoSession", hiLoSessionSchema);
export default HiLoSession;
