import HiddenCategory from "../models/HiddenCategory.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

/**
 * POST /api/user/hidden-categories/verify-password
 * Verify user password for hidden category access
 */
export const verifyPassword = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const user = await User.findById(userId).select("password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    return res.status(200).json({
      success: true,
      message: "Password verified successfully"
    });
  } catch (err) {
    console.error("verifyPassword error:", err);
    return res.status(500).json({ success: false, message: "Failed to verify password" });
  }
};

/**
 * POST /api/user/hidden-categories
 * Create a new hidden category
 */
export const createHiddenCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { name, description } = req.body;
    
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    // Check if category name already exists for this user
    const existingCategory = await HiddenCategory.findOne({
      user: userId,
      name: name.trim(),
      isActive: true
    });

    if (existingCategory) {
      return res.status(400).json({ success: false, message: "Category name already exists" });
    }

    const hiddenCategory = await HiddenCategory.create({
      user: userId,
      name: name.trim(),
      description: description ? description.trim() : "",
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: "Hidden category created successfully",
      category: hiddenCategory
    });
  } catch (err) {
    console.error("createHiddenCategory error:", err);
    return res.status(500).json({ success: false, message: "Failed to create hidden category" });
  }
};

/**
 * GET /api/user/hidden-categories
 * Get all hidden categories for the user
 */
export const getHiddenCategories = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const categories = await HiddenCategory.find({
      user: userId,
      isActive: true
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      categories
    });
  } catch (err) {
    console.error("getHiddenCategories error:", err);
    return res.status(500).json({ success: false, message: "Failed to get hidden categories" });
  }
};

/**
 * PUT /api/user/hidden-categories/:id
 * Update a hidden category
 */
export const updateHiddenCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const category = await HiddenCategory.findOne({
      _id: id,
      user: userId,
      isActive: true
    });

    if (!category) {
      return res.status(404).json({ success: false, message: "Hidden category not found" });
    }

    // Check if new name conflicts with existing categories
    const existingCategory = await HiddenCategory.findOne({
      user: userId,
      name: name.trim(),
      isActive: true,
      _id: { $ne: id }
    });

    if (existingCategory) {
      return res.status(400).json({ success: false, message: "Category name already exists" });
    }

    category.name = name.trim();
    category.description = description ? description.trim() : "";
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Hidden category updated successfully",
      category
    });
  } catch (err) {
    console.error("updateHiddenCategory error:", err);
    return res.status(500).json({ success: false, message: "Failed to update hidden category" });
  }
};

/**
 * DELETE /api/user/hidden-categories/:id
 * Soft delete a hidden category
 */
export const deleteHiddenCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id } = req.params;

    const category = await HiddenCategory.findOne({
      _id: id,
      user: userId,
      isActive: true
    });

    if (!category) {
      return res.status(404).json({ success: false, message: "Hidden category not found" });
    }

    // Soft delete by setting isActive to false
    category.isActive = false;
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Hidden category deleted successfully"
    });
  } catch (err) {
    console.error("deleteHiddenCategory error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete hidden category" });
  }
};
