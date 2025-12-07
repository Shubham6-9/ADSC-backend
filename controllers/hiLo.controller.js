import HiLoSession from "../models/HiLoSession.js";
import User from "../models/User.js";
import CurrencyTransaction from "../models/CurrencyTransaction.js";
import mongoose from "mongoose";

/**
 * Helper: Create a shuffled deck of 52 cards
 */
function createDeck() {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const deck = [];

    for (const suit of suits) {
        for (let rank = 1; rank <= 13; rank++) {
            deck.push({ suit, rank });
        }
    }

    // Shuffle using Fisher-Yates algorithm
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}

/**
 * Helper: Calculate multiplier based on probability
 */
function calculateMultiplier(currentRank, guess, consecutiveWins) {
    const cardsRemaining = 52; // Simplified - in real game would track used cards

    // Calculate probabilities
    let higherCount = 0;
    let lowerCount = 0;
    let sameCount = 3; // 3 cards of same rank remaining (since one is shown)

    for (let rank = 1; rank <= 13; rank++) {
        const count = 4; // 4 cards of each rank
        if (rank > currentRank) higherCount += count;
        if (rank < currentRank) lowerCount += count;
    }

    // Determine probability of the guess being correct
    let probability;
    if (guess === "higher") {
        probability = higherCount / cardsRemaining;
    } else if (guess === "lower") {
        probability = lowerCount / cardsRemaining;
    } else { // same
        probability = sameCount / cardsRemaining;
    }

    // Base multiplier calculation
    // Higher probability = lower multiplier
    // Lower probability = higher multiplier
    let baseMultiplier;
    if (probability >= 0.6) {
        baseMultiplier = 1.05;
    } else if (probability >= 0.4) {
        baseMultiplier = 1.10;
    } else if (probability >= 0.2) {
        baseMultiplier = 1.25;
    } else if (probability >= 0.1) {
        baseMultiplier = 2.0;
    } else {
        baseMultiplier = 5.0; // Very rare events like "same"
    }

    // For consecutive wins, increase multiplier
    // Pattern: 1.05 → 1.10 → 1.20 → 1.40 → 1.80
    if (consecutiveWins > 0 && baseMultiplier < 2.0) {
        const increment = 0.05 * Math.pow(2, consecutiveWins - 1);
        baseMultiplier = 1.05 + increment;
    }

    return parseFloat(baseMultiplier.toFixed(2));
}

/**
 * Helper: Create currency transaction
 */
async function createHiLoTransaction(userId, amount, type, description) {
    const user = await User.findById(userId);
    const balanceBefore = user.virtualCurrency;
    const balanceAfter = balanceBefore + amount;

    const transaction = await CurrencyTransaction.create({
        user: userId,
        amount,
        type,
        balanceBefore,
        balanceAfter,
        description,
    });

    user.virtualCurrency = balanceAfter;
    await user.save();

    return transaction;
}

/**
 * POST /api/user/games/hi_lo/start
 * Start a new Hi-Lo game session
 */
export const startHiLoGame = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { wagerAmount } = req.body;

        if (!wagerAmount || wagerAmount < 20) {
            return res.status(400).json({
                success: false,
                message: "Minimum wager is 20 coins"
            });
        }

        const user = await User.findById(userId);

        // Check balance
        if (user.virtualCurrency < wagerAmount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. You have ${user.virtualCurrency} coins but need ${wagerAmount}`,
            });
        }

        // Check for active session
        const activeSession = await HiLoSession.findOne({
            user: userId,
            status: "active",
        });

        if (activeSession) {
            return res.status(400).json({
                success: false,
                message: "You already have an active Hi-Lo session. Please complete or abandon it first.",
            });
        }

        // Deduct wager from balance
        await createHiLoTransaction(
            userId,
            -wagerAmount,
            "game_entry",
            `Started Hi-Lo game with ${wagerAmount} coins`
        );

        // Create shuffled deck and draw first card
        const deck = createDeck();
        const currentCard = deck.pop();

        // Create session
        const session = await HiLoSession.create({
            user: userId,
            wagerAmount,
            currentAmount: wagerAmount,
            currentCard,
            deck,
            consecutiveWins: 0,
            currentMultiplier: 1.05,
            status: "active",
        });

        return res.status(201).json({
            success: true,
            message: "Hi-Lo game started!",
            session: {
                sessionId: session._id,
                currentCard,
                currentAmount: wagerAmount,
                wagerAmount,
                consecutiveWins: 0,
                currentMultiplier: 1.05,
            },
        });
    } catch (err) {
        console.error("❌ startHiLoGame error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to start Hi-Lo game",
            error: err.message
        });
    }
};

/**
 * POST /api/user/games/hi_lo/guess
 * Make a guess (higher, lower, or same)
 */
export const makeHiLoGuess = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { sessionId, guess } = req.body;

        if (!sessionId || !guess || !["higher", "lower", "same"].includes(guess)) {
            return res.status(400).json({
                success: false,
                message: "Invalid guess. Must be 'higher', 'lower', or 'same'"
            });
        }

        const session = await HiLoSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        if (session.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        if (session.status !== "active") {
            return res.status(400).json({
                success: false,
                message: "Session is not active"
            });
        }

        if (session.deck.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No more cards in deck"
            });
        }

        // Draw next card
        const nextCard = session.deck.pop();
        const currentCard = session.currentCard;

        // Determine if guess was correct
        let wasCorrect = false;
        if (guess === "higher" && nextCard.rank > currentCard.rank) {
            wasCorrect = true;
        } else if (guess === "lower" && nextCard.rank < currentCard.rank) {
            wasCorrect = true;
        } else if (guess === "same" && nextCard.rank === currentCard.rank) {
            wasCorrect = true;
        }

        const amountBefore = session.currentAmount;
        let amountAfter = amountBefore;
        let newConsecutiveWins = session.consecutiveWins;
        let newMultiplier = session.currentMultiplier;

        if (wasCorrect) {
            // Calculate multiplier based on probability and consecutive wins
            const multiplier = calculateMultiplier(currentCard.rank, guess, session.consecutiveWins);
            amountAfter = Math.floor(amountBefore * multiplier);
            newConsecutiveWins = session.consecutiveWins + 1;

            // Calculate next multiplier (for display)
            newMultiplier = 1.05 + (0.05 * Math.pow(2, newConsecutiveWins));
            newMultiplier = parseFloat(newMultiplier.toFixed(2));
        } else {
            // Wrong guess - lose everything
            amountAfter = 0;
            session.status = "lost";
            session.finalAmount = 0;
            session.endedAt = new Date();
        }

        // Add to history
        session.gameHistory.push({
            card: currentCard,
            guess,
            nextCard,
            wasCorrect,
            multiplier: wasCorrect ? calculateMultiplier(currentCard.rank, guess, session.consecutiveWins) : 0,
            amountBefore,
            amountAfter,
        });

        // Update session
        session.currentCard = nextCard;
        session.currentAmount = amountAfter;
        session.consecutiveWins = wasCorrect ? newConsecutiveWins : 0;
        session.currentMultiplier = newMultiplier;

        await session.save();

        // If lost, no reward
        if (!wasCorrect) {
            return res.status(200).json({
                success: true,
                wasCorrect: false,
                message: "Wrong guess! You lost your wagered coins.",
                nextCard,
                currentAmount: 0,
                finalAmount: 0,
                gameOver: true,
                netProfit: -session.wagerAmount,
            });
        }

        return res.status(200).json({
            success: true,
            wasCorrect: true,
            message: "Correct! Your winnings increased!",
            nextCard,
            currentCard: nextCard,
            currentAmount: amountAfter,
            consecutiveWins: newConsecutiveWins,
            currentMultiplier: newMultiplier,
            gameOver: false,
            cardsRemaining: session.deck.length,
        });
    } catch (err) {
        console.error("❌ makeHiLoGuess error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to process guess",
            error: err.message
        });
    }
};

/**
 * POST /api/user/games/hi_lo/skip
 * Skip cards and reset multiplier (but keep playing with current amount)
 */
export const skipHiLoCards = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { sessionId, cardsToSkip = 1 } = req.body;

        if (!sessionId) {
            return res.status(400).json({ success: false, message: "Session ID required" });
        }

        const session = await HiLoSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        if (session.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        if (session.status !== "active") {
            return res.status(400).json({ success: false, message: "Session is not active" });
        }

        if (session.deck.length === 0) {
            return res.status(400).json({ success: false, message: "No more cards in deck" });
        }

        // Skip the specified number of cards
        const actualCardsToSkip = Math.min(cardsToSkip, session.deck.length);
        for (let i = 0; i < actualCardsToSkip; i++) {
            if (session.deck.length > 0) {
                session.currentCard = session.deck.pop();
            }
        }

        // Reset consecutive wins and multiplier
        session.consecutiveWins = 0;
        session.currentMultiplier = 1.05;

        await session.save();

        return res.status(200).json({
            success: true,
            message: `Skipped ${actualCardsToSkip} card(s). Multiplier reset to 1.05x`,
            currentCard: session.currentCard,
            currentAmount: session.currentAmount,
            consecutiveWins: 0,
            currentMultiplier: 1.05,
            cardsRemaining: session.deck.length,
        });
    } catch (err) {
        console.error("❌ skipHiLoCards error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to skip cards",
            error: err.message
        });
    }
};

/**
 * POST /api/user/games/hi_lo/cashout
 * Cash out and end the game, keeping current winnings
 */
export const cashOutHiLo = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ success: false, message: "Session ID required" });
        }

        const session = await HiLoSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        if (session.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        if (session.status !== "active") {
            return res.status(400).json({ success: false, message: "Session is not active" });
        }

        // Cash out - give user their current amount
        const finalAmount = session.currentAmount;
        const netProfit = finalAmount - session.wagerAmount;

        session.status = "cashed_out";
        session.finalAmount = finalAmount;
        session.endedAt = new Date();
        await session.save();

        // Add winnings to balance
        if (finalAmount > 0) {
            await createHiLoTransaction(
                userId,
                finalAmount,
                "game_reward",
                `Hi-Lo cash out: Won ${finalAmount} coins (${netProfit > 0 ? '+' : ''}${netProfit} profit)`
            );
        }

        return res.status(200).json({
            success: true,
            message: netProfit > 0
                ? `Cashed out! You won ${netProfit} coins!`
                : netProfit === 0
                    ? "Cashed out at break-even"
                    : `Cashed out with ${Math.abs(netProfit)} coins lost`,
            finalAmount,
            wagerAmount: session.wagerAmount,
            netProfit,
            consecutiveWins: session.consecutiveWins,
            totalGuesses: session.gameHistory.length,
        });
    } catch (err) {
        console.error("❌ cashOutHiLo error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to cash out",
            error: err.message
        });
    }
};

/**
 * POST /api/user/games/hi_lo/abandon
 * Abandon the game (loses wagered amount)
 */
export const abandonHiLo = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ success: false, message: "Session ID required" });
        }

        const session = await HiLoSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        if (session.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        if (session.status !== "active") {
            return res.status(400).json({ success: false, message: "Session is not active" });
        }

        // Mark as abandoned - wagered coins are lost
        session.status = "abandoned";
        session.finalAmount = 0;
        session.endedAt = new Date();
        await session.save();

        return res.status(200).json({
            success: true,
            message: "Game abandoned. Wagered coins were lost.",
            wagerAmount: session.wagerAmount,
            netProfit: -session.wagerAmount,
        });
    } catch (err) {
        console.error("❌ abandonHiLo error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to abandon game",
            error: err.message
        });
    }
};

/**
 * GET /api/user/games/hi_lo/session
 * Get current active session
 */
export const getHiLoSession = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const session = await HiLoSession.findOne({
            user: userId,
            status: "active",
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "No active session found"
            });
        }

        return res.status(200).json({
            success: true,
            session: {
                sessionId: session._id,
                currentCard: session.currentCard,
                currentAmount: session.currentAmount,
                wagerAmount: session.wagerAmount,
                consecutiveWins: session.consecutiveWins,
                currentMultiplier: session.currentMultiplier,
                cardsRemaining: session.deck.length,
                gameHistory: session.gameHistory,
            },
        });
    } catch (err) {
        console.error("❌ getHiLoSession error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to get session",
            error: err.message
        });
    }
};
