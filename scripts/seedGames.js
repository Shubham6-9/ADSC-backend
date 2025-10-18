import mongoose from "mongoose";
import dotenv from "dotenv";
import Game from "../models/Game.js";
import TriviaQuestion from "../models/TriviaQuestion.js";

dotenv.config();

const games = [
  {
    gameType: "trivia",
    name: "Financial Trivia Showdown",
    description: "Test your knowledge on Indian finance topics like Stock Market, Income Tax, GST, and Mutual Funds. Earn coins for correct answers!",
    icon: "🧠",
    minEntryFee: 10,
    maxEntryFee: 100,
    defaultEntryFee: 25,
    maxRewardMultiplier: 3,
    houseEdgePercent: 20,
    difficulty: "easy",
    isActive: true,
    dailyPlayLimit: 10,
    cooldownMinutes: 5,
    minimumLevel: 1,
    rules: [
      "Answer 10 multiple-choice questions",
      "Each correct answer earns points",
      "Score 80%+ to win 2x-3x your entry fee",
      "Score 60-79% to win 1.5x-2x your entry fee",
      "Score 40-59% to get your entry fee back",
      "Below 40% means you lose your entry fee"
    ],
    gameSettings: {
      questionsPerGame: 10,
      timePerQuestion: 30,
      maxScore: 100,
    },
  },
  {
    gameType: "crypto_mining",
    name: "Cryptocurrency Mining Game",
    description: "Mine virtual crypto through challenges simulating Indian market conditions. Trade Bitcoin and Ethereum to accumulate coins!",
    icon: "⛏️",
    minEntryFee: 50,
    maxEntryFee: 200,
    defaultEntryFee: 100,
    maxRewardMultiplier: 4,
    houseEdgePercent: 15,
    difficulty: "hard",
    isActive: false, // Will activate later
    dailyPlayLimit: 5,
    cooldownMinutes: 10,
    minimumLevel: 5,
    rules: [
      "Trade virtual cryptocurrencies",
      "Buy low, sell high within time limit",
      "Market prices fluctuate realistically",
      "Make profitable trades to win coins"
    ],
    gameSettings: {
      sessionDuration: 300,
      maxScore: 100,
    },
  },
  {
    gameType: "entrepreneur",
    name: "Entrepreneur Simulator",
    description: "Start a virtual business in India. Navigate GST, taxes, and business compliance to reach financial milestones!",
    icon: "🏗️",
    minEntryFee: 100,
    maxEntryFee: 500,
    defaultEntryFee: 200,
    maxRewardMultiplier: 5,
    houseEdgePercent: 20,
    difficulty: "hard",
    isActive: false, // Will activate later
    dailyPlayLimit: 3,
    cooldownMinutes: 15,
    minimumLevel: 10,
    rules: [
      "Make strategic business decisions",
      "Manage revenue, costs, and taxes",
      "Reach profitability milestones",
      "Expand your business successfully"
    ],
    gameSettings: {
      turnsPerGame: 20,
      maxScore: 100,
    },
  },
  {
    gameType: "tax_simulator",
    name: "Tax Filing Challenge",
    description: "Simulate filing taxes in India using tax slabs, deductions, and rebates. Maximize refunds with smart strategies!",
    icon: "📋",
    minEntryFee: 30,
    maxEntryFee: 150,
    defaultEntryFee: 50,
    maxRewardMultiplier: 3,
    houseEdgePercent: 25,
    difficulty: "medium",
    isActive: false, // Will activate later
    dailyPlayLimit: 5,
    cooldownMinutes: 10,
    minimumLevel: 3,
    rules: [
      "File tax returns for given scenarios",
      "Apply correct deductions (80C, HRA, etc.)",
      "Calculate tax accurately",
      "Optimize tax liability legally"
    ],
    gameSettings: {
      scenariosPerGame: 1,
      maxScore: 100,
    },
  },
  {
    gameType: "escape_room",
    name: "Financial Escape Room",
    description: "Solve finance-related puzzles on budgeting, loans, and investments to 'escape' from rooms. Beat the clock!",
    icon: "🚪",
    minEntryFee: 25,
    maxEntryFee: 150,
    defaultEntryFee: 50,
    maxRewardMultiplier: 4,
    houseEdgePercent: 25,
    difficulty: "medium",
    isActive: false, // Will activate later
    dailyPlayLimit: 5,
    cooldownMinutes: 10,
    minimumLevel: 2,
    rules: [
      "Solve 5 financial puzzles",
      "Complete challenges to unlock next room",
      "Time pressure adds bonus multiplier",
      "Use hints at the cost of coins"
    ],
    gameSettings: {
      roomsPerGame: 5,
      timeLimit: 600,
      maxScore: 100,
    },
  },
];

const triviaQuestions = [
  // Stock Market - Easy
  {
    category: "stock_market",
    difficulty: "easy",
    question: "What does BSE stand for?",
    options: [
      { text: "Bombay Stock Exchange", isCorrect: true },
      { text: "Bangalore Stock Exchange", isCorrect: false },
      { text: "Bihar Stock Exchange", isCorrect: false },
      { text: "Bengali Stock Exchange", isCorrect: false },
    ],
    explanation: "BSE stands for Bombay Stock Exchange, one of India's oldest stock exchanges established in 1875.",
    points: 10,
  },
  {
    category: "stock_market",
    difficulty: "easy",
    question: "What is the full form of NSE?",
    options: [
      { text: "National Stock Exchange", isCorrect: true },
      { text: "New Stock Exchange", isCorrect: false },
      { text: "Northern Stock Exchange", isCorrect: false },
      { text: "Nifty Stock Exchange", isCorrect: false },
    ],
    explanation: "NSE stands for National Stock Exchange of India, established in 1992.",
    points: 10,
  },
  {
    category: "stock_market",
    difficulty: "easy",
    question: "What is the benchmark index of BSE called?",
    options: [
      { text: "SENSEX", isCorrect: true },
      { text: "NIFTY", isCorrect: false },
      { text: "BSE 500", isCorrect: false },
      { text: "MIDCAP", isCorrect: false },
    ],
    explanation: "SENSEX (Sensitive Index) is the benchmark index of BSE, comprising 30 well-established companies.",
    points: 10,
  },
  {
    category: "stock_market",
    difficulty: "medium",
    question: "What is the minimum number of shares you can buy in the Indian stock market?",
    options: [
      { text: "1 share", isCorrect: true },
      { text: "10 shares", isCorrect: false },
      { text: "50 shares", isCorrect: false },
      { text: "100 shares", isCorrect: false },
    ],
    explanation: "In India, you can buy as little as 1 share of any company, making stock investment accessible.",
    points: 15,
  },
  {
    category: "stock_market",
    difficulty: "hard",
    question: "What is the circuit limit for stocks in India?",
    options: [
      { text: "10% or 20% depending on the stock", isCorrect: true },
      { text: "5% for all stocks", isCorrect: false },
      { text: "15% for all stocks", isCorrect: false },
      { text: "No limit exists", isCorrect: false },
    ],
    explanation: "Most stocks have a 10% circuit limit, while some have 20%. This prevents extreme volatility.",
    points: 20,
  },

  // Income Tax - Easy
  {
    category: "income_tax",
    difficulty: "easy",
    question: "What is the basic exemption limit for individuals below 60 years under the old tax regime in India (FY 2023-24)?",
    options: [
      { text: "₹2.5 lakh", isCorrect: true },
      { text: "₹3 lakh", isCorrect: false },
      { text: "₹5 lakh", isCorrect: false },
      { text: "₹2 lakh", isCorrect: false },
    ],
    explanation: "For individuals below 60 years, income up to ₹2.5 lakh is tax-free under the old tax regime.",
    points: 10,
  },
  {
    category: "income_tax",
    difficulty: "easy",
    question: "What does PAN stand for?",
    options: [
      { text: "Permanent Account Number", isCorrect: true },
      { text: "Personal Account Number", isCorrect: false },
      { text: "Public Account Number", isCorrect: false },
      { text: "Primary Account Number", isCorrect: false },
    ],
    explanation: "PAN (Permanent Account Number) is a 10-digit unique alphanumeric identifier issued by the Income Tax Department.",
    points: 10,
  },
  {
    category: "income_tax",
    difficulty: "medium",
    question: "Under Section 80C, what is the maximum deduction allowed per financial year?",
    options: [
      { text: "₹1.5 lakh", isCorrect: true },
      { text: "₹1 lakh", isCorrect: false },
      { text: "₹2 lakh", isCorrect: false },
      { text: "₹50,000", isCorrect: false },
    ],
    explanation: "Section 80C allows a maximum deduction of ₹1.5 lakh for investments in PPF, ELSS, life insurance, etc.",
    points: 15,
  },
  {
    category: "income_tax",
    difficulty: "medium",
    question: "What is TDS?",
    options: [
      { text: "Tax Deducted at Source", isCorrect: true },
      { text: "Tax Deposited at Source", isCorrect: false },
      { text: "Total Direct Service", isCorrect: false },
      { text: "Tax Distribution System", isCorrect: false },
    ],
    explanation: "TDS (Tax Deducted at Source) is a system where tax is collected at the source of income generation.",
    points: 15,
  },
  {
    category: "income_tax",
    difficulty: "hard",
    question: "What is the maximum deduction allowed under Section 80D for health insurance premium for self and family (below 60 years)?",
    options: [
      { text: "₹25,000", isCorrect: true },
      { text: "₹50,000", isCorrect: false },
      { text: "₹15,000", isCorrect: false },
      { text: "₹1 lakh", isCorrect: false },
    ],
    explanation: "Under Section 80D, you can claim up to ₹25,000 for health insurance premiums for self, spouse, and children below 60.",
    points: 20,
  },

  // GST - Easy
  {
    category: "gst",
    difficulty: "easy",
    question: "What does GST stand for?",
    options: [
      { text: "Goods and Services Tax", isCorrect: true },
      { text: "General Sales Tax", isCorrect: false },
      { text: "Government Service Tax", isCorrect: false },
      { text: "Goods Supply Tax", isCorrect: false },
    ],
    explanation: "GST stands for Goods and Services Tax, a comprehensive indirect tax implemented in India in 2017.",
    points: 10,
  },
  {
    category: "gst",
    difficulty: "easy",
    question: "When was GST implemented in India?",
    options: [
      { text: "1st July 2017", isCorrect: true },
      { text: "1st April 2017", isCorrect: false },
      { text: "1st January 2018", isCorrect: false },
      { text: "1st July 2016", isCorrect: false },
    ],
    explanation: "GST was implemented in India on July 1, 2017, replacing multiple indirect taxes.",
    points: 10,
  },
  {
    category: "gst",
    difficulty: "medium",
    question: "How many GST rate slabs are there in India (excluding 0%)?",
    options: [
      { text: "4 slabs (5%, 12%, 18%, 28%)", isCorrect: true },
      { text: "3 slabs", isCorrect: false },
      { text: "5 slabs", isCorrect: false },
      { text: "2 slabs", isCorrect: false },
    ],
    explanation: "India has 4 main GST slabs: 5%, 12%, 18%, and 28%, plus a 0% rate for essential items.",
    points: 15,
  },
  {
    category: "gst",
    difficulty: "medium",
    question: "What is the GST rate on most essential food items like rice, wheat, and milk?",
    options: [
      { text: "0%", isCorrect: true },
      { text: "5%", isCorrect: false },
      { text: "12%", isCorrect: false },
      { text: "2.5%", isCorrect: false },
    ],
    explanation: "Essential food items like rice, wheat, milk, and fresh vegetables are exempt from GST (0% rate).",
    points: 15,
  },
  {
    category: "gst",
    difficulty: "hard",
    question: "What is the threshold limit for GST registration for service providers?",
    options: [
      { text: "₹20 lakh (₹10 lakh for special category states)", isCorrect: true },
      { text: "₹40 lakh for all states", isCorrect: false },
      { text: "₹10 lakh for all states", isCorrect: false },
      { text: "₹50 lakh", isCorrect: false },
    ],
    explanation: "Service providers must register for GST if their annual turnover exceeds ₹20 lakh (₹10 lakh for special states).",
    points: 20,
  },

  // Mutual Funds - Easy
  {
    category: "mutual_funds",
    difficulty: "easy",
    question: "What is a mutual fund?",
    options: [
      { text: "A pool of money collected from investors to invest in securities", isCorrect: true },
      { text: "A type of bank account", isCorrect: false },
      { text: "A government bond", isCorrect: false },
      { text: "A fixed deposit scheme", isCorrect: false },
    ],
    explanation: "A mutual fund pools money from multiple investors to invest in stocks, bonds, or other securities.",
    points: 10,
  },
  {
    category: "mutual_funds",
    difficulty: "easy",
    question: "What does SIP stand for in mutual funds?",
    options: [
      { text: "Systematic Investment Plan", isCorrect: true },
      { text: "Simple Investment Plan", isCorrect: false },
      { text: "Standard Investment Plan", isCorrect: false },
      { text: "Scheduled Investment Program", isCorrect: false },
    ],
    explanation: "SIP (Systematic Investment Plan) allows you to invest a fixed amount regularly in mutual funds.",
    points: 10,
  },
  {
    category: "mutual_funds",
    difficulty: "medium",
    question: "What is NAV in mutual funds?",
    options: [
      { text: "Net Asset Value", isCorrect: true },
      { text: "New Account Value", isCorrect: false },
      { text: "National Average Value", isCorrect: false },
      { text: "Net Annual Value", isCorrect: false },
    ],
    explanation: "NAV (Net Asset Value) is the per-unit market value of all the assets in a mutual fund scheme.",
    points: 15,
  },
  {
    category: "mutual_funds",
    difficulty: "medium",
    question: "What type of mutual fund is ELSS?",
    options: [
      { text: "Equity Linked Savings Scheme (tax saving)", isCorrect: true },
      { text: "Emergency Liquid Savings Scheme", isCorrect: false },
      { text: "Extra Long-term Savings Scheme", isCorrect: false },
      { text: "European Linked Stock Scheme", isCorrect: false },
    ],
    explanation: "ELSS is an Equity Linked Savings Scheme that offers tax benefits under Section 80C with a 3-year lock-in period.",
    points: 15,
  },
  {
    category: "mutual_funds",
    difficulty: "hard",
    question: "What is the lock-in period for ELSS mutual funds?",
    options: [
      { text: "3 years", isCorrect: true },
      { text: "5 years", isCorrect: false },
      { text: "1 year", isCorrect: false },
      { text: "No lock-in", isCorrect: false },
    ],
    explanation: "ELSS mutual funds have a mandatory lock-in period of 3 years, the shortest among all 80C investment options.",
    points: 20,
  },

  // Banking - Easy
  {
    category: "banking",
    difficulty: "easy",
    question: "What is the full form of NEFT?",
    options: [
      { text: "National Electronic Funds Transfer", isCorrect: true },
      { text: "New Electronic Funds Transfer", isCorrect: false },
      { text: "National Easy Funds Transfer", isCorrect: false },
      { text: "National Express Funds Transfer", isCorrect: false },
    ],
    explanation: "NEFT (National Electronic Funds Transfer) is a system for transferring funds from one bank to another in India.",
    points: 10,
  },
  {
    category: "banking",
    difficulty: "easy",
    question: "What is RTGS?",
    options: [
      { text: "Real Time Gross Settlement", isCorrect: true },
      { text: "Real Transfer Gross Settlement", isCorrect: false },
      { text: "Reserve Time Gross Settlement", isCorrect: false },
      { text: "Rapid Transfer Gateway System", isCorrect: false },
    ],
    explanation: "RTGS (Real Time Gross Settlement) is used for high-value instant fund transfers in India.",
    points: 10,
  },
  {
    category: "banking",
    difficulty: "medium",
    question: "What is the minimum amount required for RTGS transactions?",
    options: [
      { text: "₹2 lakh", isCorrect: true },
      { text: "₹1 lakh", isCorrect: false },
      { text: "₹5 lakh", isCorrect: false },
      { text: "No minimum", isCorrect: false },
    ],
    explanation: "RTGS requires a minimum transaction amount of ₹2 lakh, while NEFT has no minimum limit.",
    points: 15,
  },
  {
    category: "banking",
    difficulty: "medium",
    question: "What does UPI stand for?",
    options: [
      { text: "Unified Payments Interface", isCorrect: true },
      { text: "Universal Payment Interface", isCorrect: false },
      { text: "United Payment Index", isCorrect: false },
      { text: "Unique Payment Identifier", isCorrect: false },
    ],
    explanation: "UPI (Unified Payments Interface) is a real-time payment system developed by NPCI.",
    points: 15,
  },
  {
    category: "banking",
    difficulty: "hard",
    question: "What is the deposit insurance coverage provided by DICGC per depositor per bank?",
    options: [
      { text: "₹5 lakh", isCorrect: true },
      { text: "₹1 lakh", isCorrect: false },
      { text: "₹10 lakh", isCorrect: false },
      { text: "₹2 lakh", isCorrect: false },
    ],
    explanation: "DICGC (Deposit Insurance and Credit Guarantee Corporation) insures deposits up to ₹5 lakh per depositor per bank.",
    points: 20,
  },

  // Insurance - Easy
  {
    category: "insurance",
    difficulty: "easy",
    question: "What is term insurance?",
    options: [
      { text: "Life insurance for a specific period", isCorrect: true },
      { text: "Health insurance", isCorrect: false },
      { text: "Vehicle insurance", isCorrect: false },
      { text: "Property insurance", isCorrect: false },
    ],
    explanation: "Term insurance provides life coverage for a specific period. If the insured dies during the term, beneficiaries receive the sum assured.",
    points: 10,
  },
  {
    category: "insurance",
    difficulty: "easy",
    question: "What is the primary purpose of health insurance?",
    options: [
      { text: "Cover medical expenses", isCorrect: true },
      { text: "Provide income during illness", isCorrect: false },
      { text: "Save taxes", isCorrect: false },
      { text: "Investment growth", isCorrect: false },
    ],
    explanation: "Health insurance primarily covers hospitalization and medical treatment expenses.",
    points: 10,
  },
  {
    category: "insurance",
    difficulty: "medium",
    question: "What is a premium in insurance?",
    options: [
      { text: "The amount paid to keep the policy active", isCorrect: true },
      { text: "The claim amount", isCorrect: false },
      { text: "The insurance company's profit", isCorrect: false },
      { text: "A bonus payment", isCorrect: false },
    ],
    explanation: "Premium is the regular payment made to the insurance company to keep the policy active.",
    points: 15,
  },
  {
    category: "insurance",
    difficulty: "medium",
    question: "What is a deductible in health insurance?",
    options: [
      { text: "Amount you pay before insurance kicks in", isCorrect: true },
      { text: "The maximum claim amount", isCorrect: false },
      { text: "Tax deduction benefit", isCorrect: false },
      { text: "Premium discount", isCorrect: false },
    ],
    explanation: "A deductible is the amount you must pay out-of-pocket before the insurance company starts covering costs.",
    points: 15,
  },
  {
    category: "insurance",
    difficulty: "hard",
    question: "What is the waiting period for pre-existing diseases in most health insurance policies?",
    options: [
      { text: "2-4 years", isCorrect: true },
      { text: "6 months", isCorrect: false },
      { text: "1 year", isCorrect: false },
      { text: "5 years", isCorrect: false },
    ],
    explanation: "Most health insurance policies have a waiting period of 2-4 years for pre-existing diseases coverage.",
    points: 20,
  },

  // Cryptocurrency - Easy
  {
    category: "cryptocurrency",
    difficulty: "easy",
    question: "What is Bitcoin?",
    options: [
      { text: "A digital cryptocurrency", isCorrect: true },
      { text: "A payment app", isCorrect: false },
      { text: "A bank", isCorrect: false },
      { text: "A stock exchange", isCorrect: false },
    ],
    explanation: "Bitcoin is the first and most popular decentralized digital cryptocurrency created in 2009.",
    points: 10,
  },
  {
    category: "cryptocurrency",
    difficulty: "medium",
    question: "What technology powers most cryptocurrencies?",
    options: [
      { text: "Blockchain", isCorrect: true },
      { text: "Cloud computing", isCorrect: false },
      { text: "Artificial Intelligence", isCorrect: false },
      { text: "Internet of Things", isCorrect: false },
    ],
    explanation: "Blockchain is a distributed ledger technology that records all cryptocurrency transactions securely.",
    points: 15,
  },
  {
    category: "cryptocurrency",
    difficulty: "hard",
    question: "How are cryptocurrency gains taxed in India (as of 2023)?",
    options: [
      { text: "30% flat tax + 1% TDS on transfers", isCorrect: true },
      { text: "10% capital gains tax", isCorrect: false },
      { text: "20% with indexation", isCorrect: false },
      { text: "Tax-free", isCorrect: false },
    ],
    explanation: "India imposes a 30% flat tax on crypto gains with no deductions, plus 1% TDS on crypto transfers above ₹10,000.",
    points: 20,
  },

  // Financial Planning - Medium
  {
    category: "financial_planning",
    difficulty: "medium",
    question: "What is the 50-30-20 budgeting rule?",
    options: [
      { text: "50% needs, 30% wants, 20% savings", isCorrect: true },
      { text: "50% savings, 30% needs, 20% wants", isCorrect: false },
      { text: "50% wants, 30% savings, 20% needs", isCorrect: false },
      { text: "Equal distribution across categories", isCorrect: false },
    ],
    explanation: "The 50-30-20 rule suggests allocating 50% to needs, 30% to wants, and 20% to savings and investments.",
    points: 15,
  },
  {
    category: "financial_planning",
    difficulty: "medium",
    question: "What is an emergency fund?",
    options: [
      { text: "Savings for unexpected expenses", isCorrect: true },
      { text: "Money for vacations", isCorrect: false },
      { text: "Retirement savings", isCorrect: false },
      { text: "Investment capital", isCorrect: false },
    ],
    explanation: "An emergency fund is money set aside to cover 3-6 months of expenses for unexpected situations like job loss or medical emergencies.",
    points: 15,
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Game.deleteMany({});
    await TriviaQuestion.deleteMany({});
    console.log("🗑️ Cleared existing games and questions");

    // Insert games
    await Game.insertMany(games);
    console.log(`✅ Inserted ${games.length} games`);

    // Insert trivia questions
    await TriviaQuestion.insertMany(triviaQuestions);
    console.log(`✅ Inserted ${triviaQuestions.length} trivia questions`);

    console.log("🎉 Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
