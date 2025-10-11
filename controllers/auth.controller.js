import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
import SystemSetting from "../models/SystemSetting.js";
import getXpForNextLevel from "../services/getXpForNextLevel.service.js";


dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "fallbacksecret";
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

// -------------------- SIGNUP --------------------

export const signup = async (req, res) => {
  try {
    const { email, username, password, country, currency, currencySymbol } = req.body;

    // Validate inputs
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, username, and password are required.",
      });
    }

    // Validate country, currency, and currencySymbol
    if (!country || !currency || !currencySymbol) {
      return res.status(400).json({
        success: false,
        message: "Country, currency, and currency symbol are required.",
      });
    }

    // Validate currency format (should be 3 letter code like USD, EUR, INR)
    if (currency.length !== 3) {
      return res.status(400).json({
        success: false,
        message: "Currency must be a valid 3-letter code (e.g., USD, EUR, INR).",
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. ",
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username already taken.",
      });
    }

    // Hash password
    const hasedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Get XP required for next level (level 2) for a new user at level 1
    const xpForNextLevel = await getXpForNextLevel(1, Number(process.env.DEFAULT_XP_NEXT_LEVEL || 100));

    // Create new user
    const newUser = await User.create({
      email,
      username,
      password: hasedPassword,
      country,
      currency: currency.toUpperCase(),
      currencySymbol,
      level: 1,
      xp: 0,
      xpForNextLevel,
    });

    // Create token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        country: newUser.country,
        currency: newUser.currency,
        currencySymbol: newUser.currencySymbol,
      },
      token,
    });
  } catch (err) {
    console.log("Signup Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
      error: err.message,
    });
  }
};

// -------------------- ADMIN LOGIN --------------------

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Hardcoded admin credentials
    const ADMIN_EMAIL = "admin@gmail.com";
    const ADMIN_PASSWORD = "Admin@1234";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Check credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    // Generate token for admin
    const token = jwt.sign(
      { id: "admin", email: ADMIN_EMAIL, role: "admin" },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      admin: {
        id: "admin",
        email: ADMIN_EMAIL,
        role: "admin",
      },
      token,
    });
  } catch (err) {
    console.error("Admin Login Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
      error: err.message,
    });
  }
};

// -------------------- USER LOGIN --------------------

export const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Validate inputs
    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Username and password are required.",
      });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email or username.",
      });
    }

    // Compare password

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password.",
      });
    }
    // Generate token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      token,
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
      error: err.message,
    });
  }
};
